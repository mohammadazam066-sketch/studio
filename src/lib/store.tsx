
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Requirement, Quotation, Update, User, UserRole, HomeownerProfile, ShopOwnerProfile } from './types';
import { db, storage } from './firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, writeBatch, orderBy, deleteDoc, type QueryConstraint } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthChanged, loginUser, registerUser, logoutUser } from './auth';

// --- AUTH CONTEXT & PROVIDER ---

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email, password) => Promise<any>;
  register: (email, password, username, role) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (updatedProfile: Partial<HomeownerProfile | ShopOwnerProfile>, newPhotos?: { file: File, preview: string }[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return loginUser(email, password);
  };

  const register = async (email, password, username, role) => {
    return registerUser(email, password, username, role);
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };
  
  const updateUserProfile = async (updatedProfile, newPhotos) => {
     if (!currentUser) throw new Error("Not authenticated");
     await updateProfile(currentUser, updatedProfile, newPhotos);
     // Re-fetch user to update context
     const userDocRef = doc(db, 'users', currentUser.id);
     const userDocSnap = await getDoc(userDocRef);
     if (userDocSnap.exists()) {
        const profileCollection = currentUser.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
        const profileDocRef = doc(db, profileCollection, currentUser.id);
        const profileDocSnap = await getDoc(profileDocRef);
        setCurrentUser({ ...userDocSnap.data(), id: currentUser.id, profile: profileDocSnap.data() } as User);
     }
  };


  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- DATA FUNCTIONS ---

export async function getUser(userId: string): Promise<User | undefined> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
     if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() } as User;
        const profileCollection = userData.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
        const profileDocRef = doc(db, profileCollection, userId);
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
            userData.profile = profileDocSnap.data() as any;
        }
        return userData;
    }
    return undefined;
};
    
export async function updateUser(userId: string, updatedDetails: Partial<User>) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updatedDetails);
}

export async function addRequirement(requirementData: Omit<Requirement, 'id' | 'createdAt' | 'status'>) {
    const photoDataUrls = requirementData.photos;
    const uploadedPhotoUrls = await Promise.all(
        (photoDataUrls || []).map(async (dataUrl, index) => {
            const storageRef = ref(storage, `requirements/${requirementData.homeownerId}/${Date.now()}-photo-${index}.jpg`);
            await uploadString(storageRef, dataUrl, 'data_url', { contentType: 'image/jpeg' });
            return getDownloadURL(storageRef);
        })
    );

    const fullRequirementData: Omit<Requirement, 'id'> = {
        ...requirementData,
        status: 'Open',
        photos: uploadedPhotoUrls,
        createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'requirements'), fullRequirementData);
    return docRef.id;
}

export async function updateRequirement(
    requirementId: string, 
    updateData: Partial<Omit<Requirement, 'id' | 'createdAt' | 'homeownerId' | 'status' | 'photos'>>, 
    newPhotosState: (string | { file: File, preview: string })[], 
    originalPhotoUrls: string[]
) {
    const requirementRef = doc(db, 'requirements', requirementId);

    const existingUrlsToKeep = newPhotosState.filter((p): p is string => typeof p === 'string');
    const newPhotoFiles = newPhotosState.filter((p): p is { file: File; preview: string } => typeof p !== 'string');

    const urlsToDelete = originalPhotoUrls.filter(url => !existingUrlsToKeep.includes(url));
    const deletionPromises = urlsToDelete.map(url => {
        try {
            return deleteObject(ref(storage, url));
        } catch (error) {
            console.error("Failed to delete photo, it may have already been removed:", url, error);
            return Promise.resolve();
        }
    });

    const uploadPromises = newPhotoFiles.map(async (photoState, index) => {
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(photoState.file);
        });
        const reqDoc = await getDoc(requirementRef);
        const ownerId = reqDoc.data()?.homeownerId;
        const storageRef = ref(storage, `requirements/${ownerId}/${requirementId}-${Date.now()}-${index}.jpg`);
        await uploadString(storageRef, dataUrl, 'data_url', { contentType: 'image/jpeg' });
        return getDownloadURL(storageRef);
    });

    const [newUploadedUrls] = await Promise.all([
        Promise.all(uploadPromises),
        Promise.all(deletionPromises)
    ]);

    const finalPhotoUrls = [...existingUrlsToKeep, ...newUploadedUrls];
    
    const dataToUpdate: any = { ...updateData, photos: finalPhotoUrls };

    await updateDoc(requirementRef, dataToUpdate);
}


export async function deleteRequirement(requirementId: string) {
    const batch = writeBatch(db);
    const requirementRef = doc(db, 'requirements', requirementId);
    
    const reqDoc = await getDoc(requirementRef);
    if (!reqDoc.exists()) throw new Error("Requirement not found");
    
    const requirement = reqDoc.data() as Requirement;

    if (requirement.photos && requirement.photos.length > 0) {
        const photoDeletionPromises = requirement.photos.map(url => {
            try {
                return deleteObject(ref(storage, url));
            } catch (error) {
                console.error("Failed to delete requirement photo:", url, error);
                return Promise.resolve();
            }
        });
        await Promise.all(photoDeletionPromises);
    }
    
    const quotationsQuery = query(collection(db, 'quotations'), where('requirementId', '==', requirementId));
    const quotationsSnapshot = await getDocs(quotationsQuery);
    quotationsSnapshot.forEach(quoteDoc => {
        batch.delete(quoteDoc.ref);
    });

    batch.delete(requirementRef);

    await batch.commit();
}
  
export async function updateRequirementStatus(requirementId: string, status: 'Open' | 'Purchased') {
    return updateDoc(doc(db, 'requirements', requirementId), { status });
}

export async function getRequirements(filters: { homeownerId?: string; status?: 'Open' | 'Purchased' } = {}) {
    const requirementsCollection = collection(db, 'requirements');
    const constraints: QueryConstraint[] = [];

    if (filters.homeownerId) {
        constraints.push(where('homeownerId', '==', filters.homeownerId));
    }
    
    if (filters.status) {
        constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    
    const q = query(requirementsCollection, ...constraints);
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Requirement));
}


export async function getRequirementById(id: string): Promise<Requirement | undefined> {
    const docRef = doc(db, 'requirements', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Requirement;
    }
    return undefined;
}


export async function addQuotation(newQuotation: Omit<Quotation, 'id' | 'createdAt'>) {
    const quotationToAdd = {
        ...newQuotation,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'quotations'), quotationToAdd);
    return docRef.id;
};

export async function updateQuotation(quotationId: string, updatedData: Partial<Quotation>) {
    const quotationRef = doc(db, 'quotations', quotationId);
    return updateDoc(quotationRef, updatedData);
}

export async function getQuotationById(id: string): Promise<Quotation | undefined> {
    const docRef = doc(db, 'quotations', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Quotation;
    }
    return undefined;
}
  
export async function getQuotationsForRequirement(requirementId: string) {
    if (!requirementId) {
        console.error("getQuotationsForRequirement called with no requirementId");
        return [];
    }
    
    const q = query(
        collection(db, 'quotations'), 
        where('requirementId', '==', requirementId),
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
};


export async function getQuotationsByShopOwner(shopOwnerId: string) {
    if (!shopOwnerId) return [];
    const q = query(collection(db, 'quotations'), where('shopOwnerId', '==', shopOwnerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
}


export async function getProfile(userId: string) {
    if (!userId) return undefined;
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return undefined;

    const userRole = userDoc.data()?.role;
    const profileCollection = userRole === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
    
    const profileDoc = await getDoc(doc(db, profileCollection, userId));
    return profileDoc.exists() ? profileDoc.data() : undefined;
};

export async function updateProfile(
    currentUser: User, 
    updatedProfileData: Partial<ShopOwnerProfile | HomeownerProfile>, 
    newPhotos?: { file: File, preview: string }[]
) {
    if (!currentUser?.id) throw new Error("User not found.");

    const profileCollectionName = currentUser.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
    const profileRef = doc(db, profileCollectionName, currentUser.id);

    const dataToUpdate: any = { ...updatedProfileData };

    if (currentUser.role === 'shop-owner' && newPhotos) {
        const existingProfile = currentUser.profile as ShopOwnerProfile;
        const originalPhotoUrls = existingProfile.shopPhotos || [];

        const newPhotoStates = newPhotos.map(p => p.preview);
        const existingUrlsToKeep = originalPhotoUrls.filter(url => newPhotoStates.includes(url));

        const urlsToDelete = originalPhotoUrls.filter(url => !newPhotoStates.includes(url));
        const deletionPromises = urlsToDelete.map(url => deleteObject(ref(storage, url)).catch(err => console.error("Old photo deletion failed:", err)));
        
        const photosToUpload = newPhotos.filter(p => !p.preview.startsWith('https'));

        const uploadPromises = photosToUpload.map(async (photoState, index) => {
             const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(photoState.file);
            });
            const storageRef = ref(storage, `profiles/${currentUser.id}/shop-photo-${Date.now()}-${index}.jpg`);
            await uploadString(storageRef, dataUrl, 'data_url', { contentType: 'image/jpeg' });
            return getDownloadURL(storageRef);
        });

        const [newUploadedUrls] = await Promise.all([Promise.all(uploadPromises), Promise.all(deletionPromises)]);
        dataToUpdate.shopPhotos = [...existingUrlsToKeep, ...newUploadedUrls];
    }
    
    await updateDoc(profileRef, dataToUpdate);
};


// --- UPDATES FEED FUNCTIONS ---

export async function addUpdate(newUpdate: Omit<Update, 'id' | 'createdAt' | 'authorId'> & { imageUrl?: string }) {
    let finalImageUrl = newUpdate.imageUrl;
    if (newUpdate.imageUrl) {
        const storageRef = ref(storage, `updates/${newUpdate.authorName}/${Date.now()}.jpg`);
        await uploadString(storageRef, newUpdate.imageUrl, 'data_url', { contentType: 'image/jpeg' });
        finalImageUrl = await getDownloadURL(storageRef);
    }

    const updateToAdd = {
      ...newUpdate,
      imageUrl: finalImageUrl || '',
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'updates'), updateToAdd);
    return docRef.id;
}

export async function updateUpdate(
  updateId: string, 
  updateData: { title: string; content: string }, 
  newImage?: { dataUrl: string; oldImageUrl?: string }
) {
  const updateRef = doc(db, 'updates', updateId);
  const dataToUpdate: any = { ...updateData };
  const updateDocSnap = await getDoc(updateRef);
  if (!updateDocSnap.exists()) throw new Error("Update not found");
  const authorId = updateDocSnap.data().authorId;

  if (newImage && newImage.dataUrl) {
    if (newImage.oldImageUrl) {
        try {
            const oldImageRef = ref(storage, newImage.oldImageUrl);
            await deleteObject(oldImageRef);
        } catch (error) {
            console.error("Failed to delete old image, continuing update.", error);
        }
    }
    const newImageRef = ref(storage, `updates/${authorId}/${Date.now()}.jpg`);
    await uploadString(newImageRef, newImage.dataUrl, 'data_url', { contentType: 'image/jpeg' });
    dataToUpdate.imageUrl = await getDownloadURL(newImageRef);
  }
  else if (newImage && newImage.dataUrl === '') {
      if (newImage.oldImageUrl) {
         try {
            const oldImageRef = ref(storage, newImage.oldImageUrl);
            await deleteObject(oldImageRef);
        } catch (error) {
            console.error("Failed to delete old image, continuing update.", error);
        }
    }
    dataToUpdate.imageUrl = '';
  }

  await updateDoc(updateRef, dataToUpdate);
}

export async function deleteUpdate(updateId: string, imageUrl?: string) {
    if (imageUrl) {
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (error) {
            console.error("Failed to delete update image from storage:", error);
        }
    }
    
    await deleteDoc(doc(db, 'updates', updateId));
}


export async function getUpdates(): Promise<Update[]> {
    const q = query(collection(db, 'updates'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Update));
}

export async function getUpdateById(id: string): Promise<Update | undefined> {
    const docRef = doc(db, 'updates', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Update;
    }
    return undefined;
}
