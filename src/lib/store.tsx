

'use client';

import React from 'react';
import type { User, UserRole, HomeownerProfile, ShopOwnerProfile, Requirement, Quotation, Update, QuotationWithRequirement } from './types';
import { db, storage, auth } from './firebase';
import { 
    doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, 
    collection, query, where, getDocs, serverTimestamp, orderBy 
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthChanged, logoutUser } from './auth';

// --- AUTH CONTEXT & PROVIDER ---

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserProfile: (updatedProfile: Partial<HomeownerProfile | ShopOwnerProfile> & { photosToKeep?: string[] }, newPhotos?: string[]) => Promise<void>;
  handleNewUser: (user: import('firebase/auth').User, role: UserRole) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Wrap setCurrentUser to log changes
  const setCurrentUserAndLog = React.useCallback((user) => {
    setCurrentUser(user);
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthChanged((user) => {
      setCurrentUserAndLog(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setCurrentUserAndLog]);


  const logout = async () => {
    await logoutUser();
    setCurrentUserAndLog(null);
  };
  
 const updateUserProfile = async (updatedProfileData, newPhotosDataUrls = []) => {
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

    let uploadedUrls: string[] = [];
    if (newPhotosDataUrls.length > 0 && currentUser.role === 'shop-owner') {
        uploadedUrls = await uploadPhotos('shopOwnerProfiles', currentUser.id, newPhotosDataUrls);
    }
    
    const finalPhotos = [...photosToKeep, ...uploadedUrls];
    
    const { photosToKeep: _, ...restOfProfileData } = updatedProfileData;

    const finalProfileData = {
      ...restOfProfileData,
    };
    
    if(currentUser.role === 'shop-owner') {
        finalProfileData.shopPhotos = finalPhotos;
    }


    await updateDoc(profileDocRef, finalProfileData);
    
    if (finalProfileData.name && finalProfileData.name !== currentUser.profile?.name) {
        const userDocRef = doc(db, 'users', currentUser.id);
        const userDoc = await getDoc(userDocRef);
        if(userDoc.exists()) {
             // To keep things simple, we won't update other collections with the new name.
             // This can be a future improvement with cloud functions.
        }
    }

     const updatedUserDocSnap = await getDoc(doc(db, 'users', currentUser.id));
     const updatedProfileDocSnap = await getDoc(profileDocRef);

     if(updatedUserDocSnap.exists() && updatedProfileDocSnap.exists()) {
        const updatedUser = {
            ...(updatedUserDocSnap.data() as Omit<User, 'id' | 'profile'>),
            id: currentUser.id,
            profile: updatedProfileDocSnap.data(),
        } as User;
        setCurrentUserAndLog(updatedUser);
     }
  };

  const handleNewUser = async (user: import('firebase/auth').User, role: UserRole) => {
      if (!user.phoneNumber) throw new Error("User phone number is not available.");

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        console.warn("User profile already exists for uid:", user.uid);
        return; 
      }
      
      // Create user document in 'users' collection
      await setDoc(userDocRef, {
        id: user.uid,
        phoneNumber: user.phoneNumber,
        role: role,
        createdAt: serverTimestamp(),
      });
  
      // Create corresponding profile document
      const profileCollection = role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
      const profileDocRef = doc(db, profileCollection, user.uid);
      
      const defaultName = `User ${user.phoneNumber.slice(-4)}`;
  
      if (role === 'shop-owner') {
        const profileData: ShopOwnerProfile = {
            id: user.uid,
            name: defaultName,
            phoneNumber: user.phoneNumber,
            shopName: `${defaultName}'s Shop`,
            address: '',
            location: '',
            shopPhotos: [],
            createdAt: serverTimestamp(),
        };
        await setDoc(profileDocRef, profileData);
      } else {
        const profileData: HomeownerProfile = {
            id: user.uid,
            name: defaultName,
            phoneNumber: user.phoneNumber,
            address: '',
            createdAt: serverTimestamp(),
        };
         await setDoc(profileDocRef, profileData);
      }
  
      // Force a re-check of the auth state to load the new user data
      const updatedUser = onAuthChanged(user => {
        if(user) {
            setCurrentUserAndLog(user)
        }
      });
      // The onAuthChanged listener will handle the state update.
  }


  const value = {
    currentUser,
    loading,
    logout,
    updateUserProfile,
    handleNewUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


// --- FIRESTORE DATA FUNCTIONS ---

// Helper to upload photos and get URLs
const uploadPhotos = async (collectionName: string, userId: string, photosDataUrls: string[], documentId?: string): Promise<string[]> => {
    const urls = await Promise.all(
        photosDataUrls.map(async (dataUrl) => {
            const path = `${collectionName}/${userId}/${documentId ? `${documentId}/` : ''}${Date.now()}-${Math.random()}`;
            const photoRef = ref(storage, path);
            await uploadString(photoRef, dataUrl, 'data_url');
            return getDownloadURL(photoRef);
        })
    );
    return urls;
}


// == REQUIREMENTS ==

export const addRequirement = async (data, photosDataUrls: string[]) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.data() as User;

    const profileDocRef = doc(db, 'homeownerProfiles', auth.currentUser.uid);
    const profileDocSnap = await getDoc(profileDocRef);
    const profileData = profileDocSnap.data() as HomeownerProfile;


    const requirementRef = await addDoc(collection(db, 'requirements'), {
        ...data,
        homeownerId: auth.currentUser.uid,
        homeownerName: profileData?.name || userData?.phoneNumber || 'Anonymous',
        createdAt: serverTimestamp(),
        status: 'Open',
        photos: [], // Start with empty array
    });

    const photoUrls = await uploadPhotos('requirements', auth.currentUser.uid, photosDataUrls, requirementRef.id);
    await updateDoc(requirementRef, { photos: photoUrls });

    return requirementRef.id;
}

export const updateRequirement = async (id, data, newPhotosDataUrls: string[], remainingExistingPhotos: string[]) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    const requirementRef = doc(db, 'requirements', id);
    
    const requirementSnap = await getDoc(requirementRef);
    const requirementData = requirementSnap.data();
    const photosToDelete = (requirementData?.photos || []).filter(url => !remainingExistingPhotos.includes(url));

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


    let photoUrls = [...remainingExistingPhotos];

    if (newPhotosDataUrls.length > 0) {
        const newPhotoUrls = await uploadPhotos('requirements', auth.currentUser.uid, newPhotosDataUrls, id);
        photoUrls.push(...newPhotoUrls);
    }
    
    await updateDoc(requirementRef, {
        ...data,
        photos: photoUrls,
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

export const getOpenRequirementsByCategory = async (category: string): Promise<Requirement[]> => {
    const q = query(
        collection(db, "requirements"),
        where("status", "==", "Open"),
        where("category", "==", category)
    );
    const querySnapshot = await getDocs(q);
    const requirements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Requirement));

    // Sort manually on the client-side to avoid needing a composite index
    return requirements.sort((a, b) => {
        const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt as string);
        const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(b.createdAt as string);
        return dateB.getTime() - dateA.getTime();
    });
}

export const getOpenRequirementsCountByCategory = async (): Promise<Record<string, number>> => {
    const q = query(
        collection(db, "requirements"), 
        where("status", "==", "Open")
    );
    const querySnapshot = await getDocs(q);
    const counts: Record<string, number> = {};
    querySnapshot.forEach(doc => {
        const requirement = doc.data() as Requirement;
        if (requirement.category) {
            counts[requirement.category] = (counts[requirement.category] || 0) + 1;
        }
    });
    return counts;
};


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
    const quotations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
    
    // Sort manually on the client-side
    return quotations.sort((a, b) => {
        const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt as string);
        const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(b.createdAt as string);
        return dateB.getTime() - dateA.getTime();
    });
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

export const getQuotationsByShopOwner = async (shopOwnerId: string): Promise<QuotationWithRequirement[]> => {
    const q = query(collection(db, "quotations"), where("shopOwnerId", "==", shopOwnerId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const quotationsWithRequirements = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
            const quote = { id: doc.id, ...doc.data() } as Quotation;
            const requirement = await getRequirementById(quote.requirementId);
            return { ...quote, requirement };
        })
    );
    
    return quotationsWithRequirements;
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

export const getHomeownerProfileById = async (userId: string): Promise<HomeownerProfile | undefined> => {
    const docRef = doc(db, "homeownerProfiles", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as HomeownerProfile;
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
    if(!userDocSnap.exists()) throw new Error("User not found");
    const userData = userDocSnap.data() as User;
    const profileCollection = userData.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
    const profileDocSnap = await getDoc(doc(db, profileCollection, auth.currentUser.uid));
    const profileData = profileDocSnap.data();

    const updateRef = await addDoc(collection(db, 'updates'), {
        ...data,
        authorId: auth.currentUser.uid,
        authorName: profileData?.name || userData.phoneNumber,
        authorRole: userData.role,
        createdAt: serverTimestamp(),
        imageUrl: '', // Initial empty value
    });
    
    if (photoDataUrl) {
        const [imageUrl] = await uploadPhotos('updates', auth.currentUser.uid, [photoDataUrl], updateRef.id);
        if (imageUrl) {
            await updateDoc(updateRef, { imageUrl });
        }
    }

    return updateRef.id;
}


export const updateUpdate = async (id: string, data: { title: string, content: string }, newImageData?: { dataUrl: string, oldImageUrl?: string }) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
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
            const [newImageUrl] = await uploadPhotos('updates', auth.currentUser.uid, [newImageData.dataUrl], id);
            updateData.imageUrl = newImageUrl || '';
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
