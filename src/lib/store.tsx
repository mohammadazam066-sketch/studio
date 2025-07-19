
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, HomeownerProfile, ShopOwnerProfile, Requirement, Quotation, Update } from './types';
import { db, storage, auth } from './firebase';
import { 
    doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, 
    collection, query, where, getDocs, serverTimestamp, orderBy 
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthChanged, loginUser, registerUser, logoutUser } from './auth';

// --- AUTH CONTEXT & PROVIDER ---

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (username, password) => Promise<any>;
  register: (username, password, role) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (updatedProfile: Partial<HomeownerProfile | ShopOwnerProfile> & { photosToKeep?: string[] }, newPhotos?: { dataUrl: string, name: string }[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Wrap setCurrentUser to log changes
  const setCurrentUserAndLog = useCallback((user) => {
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChanged((user) => {
      setCurrentUserAndLog(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setCurrentUserAndLog]);

  const login = async (username, password) => {
    return loginUser(username, password);
  };

  const register = async (username, password, role) => {
    return registerUser(username, password, role);
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUserAndLog(null);
  };
  
 const updateUserProfile = async (updatedProfileData, newPhotos = []) => {
    if (!currentUser?.id || !currentUser.role) throw new Error("Not authenticated");

    const profileCollection = currentUser.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
    const profileDocRef = doc(db, profileCollection, currentUser.id);

    const currentProfileSnap = await getDoc(profileDocRef);
    const currentProfile = currentProfileSnap.data() as ShopOwnerProfile;
    const currentPhotos = currentProfile?.shopPhotos || [];
    
    const photosToKeep = updatedProfileData.photosToKeep || [];
    const photosToDelete = currentPhotos.filter(url => !photosToKeep.includes(url));

    await Promise.all(photosToDelete.map(async (url) => {
      try {
        const photoRef = ref(storage, url);
        await deleteObject(photoRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.error("Failed to delete old photo:", error);
        }
      }
    }));

    let uploadedUrls = [];
    if (newPhotos.length > 0 && currentUser.role === 'shop-owner') {
        uploadedUrls = await Promise.all(
            newPhotos.map(async (photo) => {
                const photoRef = ref(storage, `${profileCollection}/${currentUser.id}/${Date.now()}-${photo.name}`);
                await uploadString(photoRef, photo.dataUrl, 'data_url');
                return getDownloadURL(photoRef);
            })
        );
    }
    
    const finalPhotos = [...photosToKeep, ...uploadedUrls];
    
    const { photosToKeep: _, ...restOfProfileData } = updatedProfileData;

    const finalProfileData = {
      ...restOfProfileData,
      shopPhotos: finalPhotos,
    };

    await updateDoc(profileDocRef, finalProfileData);
    
    if (finalProfileData.name && finalProfileData.name !== currentUser.username) {
        await updateDoc(doc(db, 'users', currentUser.id), { username: finalProfileData.name });
    }
    if (finalProfileData.email && finalProfileData.email !== currentUser.profile?.email) {
       await updateDoc(doc(db, 'users', currentUser.id), { email: finalProfileData.email });
    }

     const updatedUserDocSnap = await getDoc(doc(db, 'users', currentUser.id));
     const updatedProfileDocSnap = await getDoc(profileDocRef);

     if(updatedUserDocSnap.exists() && updatedProfileDocSnap.exists()) {
        const updatedUser = {
            ...updatedUserDocSnap.data(),
            id: currentUser.id,
            profile: updatedProfileDocSnap.data(),
        } as User;
        setCurrentUserAndLog(updatedUser);
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


// --- FIRESTORE DATA FUNCTIONS ---

// Helper to upload photos and get URLs
const uploadPhotos = async (collectionName: string, id: string, photos: { dataUrl: string, name: string }[]): Promise<string[]> => {
    const urls = await Promise.all(
        photos.map(async (photo) => {
            const photoRef = ref(storage, `${collectionName}/${id}/${Date.now()}-${photo.name}`);
            await uploadString(photoRef, photo.dataUrl, 'data_url');
            return getDownloadURL(photoRef);
        })
    );
    return urls;
}


// == REQUIREMENTS ==

export const addRequirement = async (data, photos: { dataUrl: string, name: string }[]) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.data();

    const requirementRef = await addDoc(collection(db, 'requirements'), {
        ...data,
        homeownerId: auth.currentUser.uid,
        homeownerName: userData?.username || 'Anonymous',
        createdAt: serverTimestamp(),
        status: 'Open',
        photos: [], // Start with empty array
    });

    const photoUrls = await uploadPhotos('requirements', requirementRef.id, photos);
    await updateDoc(requirementRef, { photos: photoUrls });

    return requirementRef.id;
}

export const updateRequirement = async (id, data, newPhotos: { dataUrl: string, name: string }[], remainingExistingPhotos) => {
    const requirementRef = doc(db, 'requirements', id);
    let photoUrls = [...remainingExistingPhotos];

    if (newPhotos.length > 0) {
        const newPhotoUrls = await uploadPhotos('requirements', id, newPhotos);
        photoUrls.push(...newPhotoUrls);
    }
    
    await updateDoc(requirementRef, {
        ...data,
        photos: photoUrls
    });
}

export const deleteRequirement = async (id: string) => {
    const requirementRef = doc(db, 'requirements', id);
    // Note: This doesn't delete associated photos or quotations to keep it simple.
    // A production app would need a Cloud Function for cascading deletes.
    await deleteDoc(requirementRef);
}


export const getRequirementById = async (id: string): Promise<Requirement | undefined> => {
    const docRef = doc(db, "requirements", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Requirement;
    }
    return undefined;
}

export const getRequirementsByHomeowner = async (homeownerId: string): Promise<Requirement[]> => {
    const q = query(collection(db, "requirements"), where("homeownerId", "==", homeownerId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Requirement));
}

export const getOpenRequirements = async (): Promise<Requirement[]> => {
    const q = query(
        collection(db, "requirements"), 
        where("status", "==", "Open"),
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Requirement));
}

export const updateRequirementStatus = async (id: string, status: 'Open' | 'Purchased') => {
    const requirementRef = doc(db, 'requirements', id);
    await updateDoc(requirementRef, { status });
}

// == QUOTATIONS ==

export const addQuotation = async (data) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const profileDocRef = doc(db, 'shopOwnerProfiles', auth.currentUser.uid);
    const profileDocSnap = await getDoc(profileDocRef);
    const profileData = profileDocSnap.data() as ShopOwnerProfile;

    const quotationData = {
        ...data,
        shopOwnerId: auth.currentUser.uid,
        shopOwnerName: profileData?.name || 'Anonymous',
        shopName: profileData?.shopName || 'Unnamed Shop',
        createdAt: serverTimestamp(),
    }
    const docRef = await addDoc(collection(db, 'quotations'), quotationData);
    return docRef.id;
}

export const updateQuotation = async (id: string, data) => {
    const quotationRef = doc(db, 'quotations', id);
    await updateDoc(quotationRef, data);
}

export const getQuotationById = async (id: string): Promise<Quotation | undefined> => {
    const docRef = doc(db, "quotations", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Quotation;
    }
    return undefined;
}


export const getQuotationsForRequirement = async (requirementId: string): Promise<Quotation[]> => {
    const q = query(collection(db, "quotations"), where("requirementId", "==", requirementId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
}

export const getQuotationForRequirementByShop = async (requirementId: string, shopOwnerId: string): Promise<Quotation | undefined> => {
    const q = query(
        collection(db, "quotations"), 
        where("requirementId", "==", requirementId),
        where("shopOwnerId", "==", shopOwnerId)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Quotation;
    }
    return undefined;
}

export const getQuotationsByShopOwner = async (shopOwnerId: string): Promise<Quotation[]> => {
    const q = query(collection(db, "quotations"), where("shopOwnerId", "==", shopOwnerId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
}

// == PROFILES ==

export const getProfile = async (userId: string): Promise<ShopOwnerProfile | undefined> => {
     // For now, we assume we're only viewing shop owner profiles publicly
    const docRef = doc(db, "shopOwnerProfiles", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ShopOwnerProfile;
    }
    return undefined;
}

export const getUser = async (userId: string): Promise<User | undefined> => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return undefined;
}

// == UPDATES ==

export const addUpdate = async (data: { title: string, content: string }, photoDataUrl?: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const userDocSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const userData = userDocSnap.data() as User;

    const updateRef = await addDoc(collection(db, 'updates'), {
        ...data,
        authorId: auth.currentUser.uid,
        authorName: userData.username,
        authorRole: userData.role,
        createdAt: serverTimestamp(),
        imageUrl: '', // Initial empty value
    });
    
    if (photoDataUrl) {
        const photoRef = ref(storage, `updates/${updateRef.id}/image`);
        await uploadString(photoRef, photoDataUrl, 'data_url');
        const imageUrl = await getDownloadURL(photoRef);
        await updateDoc(updateRef, { imageUrl });
    }

    return updateRef.id;
}


export const updateUpdate = async (id: string, data: { title: string, content: string }, newImageData?: { dataUrl: string, oldImageUrl?: string }) => {
    const updateRef = doc(db, 'updates', id);
    let updateData: any = { ...data };

    if (newImageData) {
        if (newImageData.oldImageUrl) {
            try {
                const oldImageRef = ref(storage, newImageData.oldImageUrl);
                await deleteObject(oldImageRef);
            } catch (error: any) {
                if (error.code !== 'storage/object-not-found') {
                    console.error("Failed to delete old image:", error);
                }
            }
        }
        
        if (newImageData.dataUrl) {
            const photoRef = ref(storage, `updates/${id}/image`);
            await uploadString(photoRef, newImageData.dataUrl, 'data_url');
            updateData.imageUrl = await getDownloadURL(photoRef);
        } else {
            updateData.imageUrl = '';
        }
    }
    
    await updateDoc(updateRef, updateData);
}

export const deleteUpdate = async (id: string, imageUrl?: string) => {
    const updateRef = doc(db, 'updates', id);
    await deleteDoc(updateRef);

    if (imageUrl) {
         try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error("Failed to delete post image:", error);
            }
        }
    }
}


export const getAllUpdates = async (): Promise<Update[]> => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Update));
}

export const getUpdateById = async (id: string): Promise<Update | undefined> => {
    const docRef = doc(db, "updates", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Update;
    }
    return undefined;
}
