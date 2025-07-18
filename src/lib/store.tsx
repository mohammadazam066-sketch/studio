
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
  updateUserProfile: (updatedProfile: Partial<HomeownerProfile | ShopOwnerProfile>, newPhotos?: { file: File, preview: string }[]) => Promise<void>;
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

    let finalProfileData = { ...updatedProfileData };

    if (newPhotos.length > 0) {
      const uploadedUrls = await Promise.all(
        newPhotos.map(async (photo) => {
          const photoRef = ref(storage, `${profileCollection}/${currentUser.id}/${Date.now()}-${photo.file.name}`);
          const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(photo.file);
          });
          await uploadString(photoRef, dataUrl, 'data_url');
          return getDownloadURL(photoRef);
        })
      );
      
      // If we are updating a shop owner, we append to existing photos.
      if (currentUser.role === 'shop-owner') {
          finalProfileData.shopPhotos = [...(updatedProfileData.shopPhotos || []), ...uploadedUrls];
      }
    }

    await updateDoc(profileDocRef, finalProfileData);
    
    // Also update the 'users' collection if the name has changed
    if (finalProfileData.name && finalProfileData.name !== currentUser.username) {
        await updateDoc(doc(db, 'users', currentUser.id), { username: finalProfileData.name });
    }
    if (finalProfileData.email && finalProfileData.email !== currentUser.email) {
       await updateDoc(doc(db, 'users', currentUser.id), { email: finalProfileData.email });
    }


    // After updating, we need to refresh the currentUser state
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
const uploadPhotos = async (collectionName: string, id: string, photos: { file: File }[]): Promise<string[]> => {
    const urls = await Promise.all(
        photos.map(async (photo) => {
            const photoRef = ref(storage, `${collectionName}/${id}/${Date.now()}-${photo.file.name}`);
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(photo.file);
            });
            await uploadString(photoRef, dataUrl, 'data_url');
            return getDownloadURL(photoRef);
        })
    );
    return urls;
}


// == REQUIREMENTS ==

export const addRequirement = async (data, photos) => {
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

    // Now upload photos and update the doc
    const photoUrls = await uploadPhotos('requirements', requirementRef.id, photos);
    await updateDoc(requirementRef, { photos: photoUrls });

    return requirementRef.id;
}

export const updateRequirement = async (id, data, newPhotos, remainingExistingPhotos) => {
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

export const getAllRequirements = async (): Promise<Requirement[]> => {
    const q = query(collection(db, "requirements"), orderBy("createdAt", "desc"));
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

    let imageUrl: string | undefined = undefined;

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
        imageUrl = await getDownloadURL(photoRef);
        await updateDoc(updateRef, { imageUrl });
    }

    return updateRef.id;
}


export const updateUpdate = async (id: string, data: { title: string, content: string }, newImageData?: { dataUrl: string, oldImageUrl?: string }) => {
    const updateRef = doc(db, 'updates', id);
    let updateData: any = { ...data };

    if (newImageData) {
        // If there's an old image, delete it
        if (newImageData.oldImageUrl) {
            try {
                const oldImageRef = ref(storage, newImageData.oldImageUrl);
                await deleteObject(oldImageRef);
            } catch (error: any) {
                // Ignore "object not found" errors, as it might have been deleted already
                if (error.code !== 'storage/object-not-found') {
                    console.error("Failed to delete old image:", error);
                }
            }
        }
        
        // If there's new image data, upload it
        if (newImageData.dataUrl) {
            const photoRef = ref(storage, `updates/${id}/image`);
            await uploadString(photoRef, newImageData.dataUrl, 'data_url');
            updateData.imageUrl = await getDownloadURL(photoRef);
        } else {
             // If dataUrl is empty, it means remove the image
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
