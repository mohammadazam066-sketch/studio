

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, HomeownerProfile, ShopOwnerProfile, Requirement, Quotation, Update, QuotationWithRequirement, Purchase, PurchaseWithDetails, Notification, Review } from './types';
import { db, storage, auth } from './firebase';
import { 
    doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, 
    collection, query, where, getDocs, serverTimestamp, orderBy, writeBatch
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { logoutUser } from './auth';
import { onAuthStateChanged } from 'firebase/auth';

// --- AUTH CONTEXT & PROVIDER ---

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserProfile: (updatedProfile: Partial<HomeownerProfile | ShopOwnerProfile> & { photosToKeep?: string[], newIcon?: string }, newPhotos?: string[]) => Promise<void>;
  handleNewUser: (user: import('firebase/auth').User, role: UserRole) => Promise<void>;
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
    const adminUids: string[] = ['OmP2c8syLshm2F7KXj4cRT9UJsr1'];
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.phoneNumber) {
        const isDesignatedAdmin = adminUids.includes(user.uid);

        if (isDesignatedAdmin) {
            const adminDocRef = doc(db, 'users', user.uid);
            let adminDocSnap = await getDoc(adminDocRef);
            
            let adminData;
            if (!adminDocSnap.exists()) {
                adminData = {
                    id: user.uid,
                    phoneNumber: user.phoneNumber,
                    role: 'admin' as UserRole,
                    createdAt: serverTimestamp(),
                    profile: {
                        name: 'Admin',
                        phoneNumber: user.phoneNumber,
                    }
                };
                await setDoc(adminDocRef, adminData);
            } else {
                 adminData = {
                    ...adminDocSnap.data(),
                    role: 'admin', // Always ensure role is admin
                    profile: {
                        name: adminDocSnap.data().profile?.name || 'Admin',
                        ...(adminDocSnap.data().profile || {}),
                        phoneNumber: user.phoneNumber
                    }
                 };
                 // If the role in DB was not admin, update it
                 if (adminDocSnap.data().role !== 'admin') {
                    await updateDoc(adminDocRef, { role: 'admin' });
                 }
            }
            setCurrentUserAndLog(adminData as User);
        } else {
            const userDocSnap = await getDoc(doc(db, 'users', user.uid));
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as User;
                let userProfile;

                const profileCollection = userData.role === 'homeowner' 
                    ? 'homeownerProfiles' 
                    : 'shopOwnerProfiles';
                const profileDocRef = doc(db, profileCollection, user.uid);
                const profileDocSnap = await getDoc(profileDocRef);
                if (profileDocSnap.exists()) {
                     userProfile = { id: profileDocSnap.id, ...profileDocSnap.data() };
                }

                setCurrentUserAndLog({ ...userData, profile: userProfile });
            }
        }
      } else {
        // User is signed out.
        setCurrentUserAndLog(null);
      }
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
    const currentProfile = currentProfileSnap.data() as ShopOwnerProfile & HomeownerProfile;
    
    // --- Photo Deletion Logic ---
    if (currentUser.role === 'shop-owner') {
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
    }

    // --- Photo Upload Logic ---
    let uploadedUrls: string[] = [];
    if (newPhotosDataUrls.length > 0) {
        if (currentUser.role === 'shop-owner') {
            uploadedUrls = await uploadPhotos('shopOwnerProfiles', currentUser.id, newPhotosDataUrls);
        } else if (currentUser.role === 'homeowner' && newPhotosDataUrls.length === 1) {
            // Homeowners can only have one profile picture
            // Delete old photo if it exists
            if (currentProfile?.photoURL) {
                try {
                    const oldPhotoRef = ref(storage, currentProfile.photoURL);
                    await deleteObject(oldPhotoRef);
                } catch (error: any) {
                     if (error.code !== 'storage/object-not-found') {
                        console.error("Failed to delete old profile picture:", error);
                    }
                }
            }
            uploadedUrls = await uploadPhotos('homeownerProfiles', currentUser.id, newPhotosDataUrls);
        }
    }
    
    const { photosToKeep: _, newIcon: newIconDataUrl, ...restOfProfileData } = updatedProfileData;

    const finalProfileData: Partial<ShopOwnerProfile & HomeownerProfile> = {
      ...restOfProfileData,
    };
    
    // --- Icon Upload Logic (Shop Owner only) ---
    if (currentUser.role === 'shop-owner' && newIconDataUrl) {
        if (currentProfile?.shopIconUrl) {
            try {
                const oldIconRef = ref(storage, currentProfile.shopIconUrl);
                await deleteObject(oldIconRef);
            } catch (error: any) {
                if (error.code !== 'storage/object-not-found') {
                    console.error("Failed to delete old shop icon:", error);
                }
            }
        }
        const [iconUrl] = await uploadPhotos('shopOwnerProfiles', currentUser.id, [newIconDataUrl], 'icon');
        finalProfileData.shopIconUrl = iconUrl;
    }

    // Add photo URLs to the correct field based on role
    if(currentUser.role === 'shop-owner') {
        const existingPhotos = updatedProfileData.photosToKeep || [];
        finalProfileData.shopPhotos = [...existingPhotos, ...uploadedUrls];
    } else if (currentUser.role === 'homeowner' && uploadedUrls.length > 0) {
        finalProfileData.photoURL = uploadedUrls[0];
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
      
      const defaultName = `User ${user.phoneNumber.slice(-4)}`;

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
      
  
      if (role === 'shop-owner') {
        const profileData: ShopOwnerProfile = {
            id: user.uid,
            name: defaultName,
            phoneNumber: user.phoneNumber,
            shopName: `${defaultName}'s Shop`,
            address: '',
            location: '',
            shopPhotos: [],
            shopIconUrl: '',
            createdAt: serverTimestamp(),
        };
        await setDoc(profileDocRef, profileData);
      } else {
        const profileData: HomeownerProfile = {
            id: user.uid,
            name: defaultName,
            phoneNumber: user.phoneNumber,
            address: '',
            occupation: '',
            photoURL: '',
            createdAt: serverTimestamp(),
        };
         await setDoc(profileDocRef, profileData);
      }
  
      // Manually trigger a state refresh to load the new user data
      const newUserDoc = await getDoc(userDocRef);
      const newProfileDoc = await getDoc(profileDocRef);
      if (newUserDoc.exists() && newProfileDoc.exists()) {
        const userData = newUserDoc.data() as User;
        const profileData = newProfileDoc.data();
        setCurrentUserAndLog({ ...userData, profile: profileData });
      }
  }


  const value = {
    currentUser,
    loading,
    logout,
    updateUserProfile,
    handleNewUser,
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
    
    // Create notifications for shop owners in the same location
    const shopOwnersQuery = query(collection(db, 'users'), where("role", "==", "shop-owner"));
    const shopOwnersSnapshot = await getDocs(shopOwnersQuery);
    
    const batch = writeBatch(db);

    for (const shopOwnerUserDoc of shopOwnersSnapshot.docs) {
        const shopOwnerProfileDoc = await getDoc(doc(db, 'shopOwnerProfiles', shopOwnerUserDoc.id));
        if (shopOwnerProfileDoc.exists()) {
            const shopOwnerProfile = shopOwnerProfileDoc.data() as ShopOwnerProfile;
            if (shopOwnerProfile.location === data.location) {
                 const notifRef = doc(collection(db, 'notifications'));
                 batch.set(notifRef, {
                    userId: shopOwnerUserDoc.id,
                    message: `New requirement '${data.title}' posted in ${data.location}.`,
                    link: `/shop-owner/requirements/${requirementRef.id}`,
                    read: false,
                    createdAt: serverTimestamp(),
                    type: 'requirement'
                });
            }
        }
    }
    
    await batch.commit();


    return requirementRef.id;
}

export const updateRequirement = async (id: string, data: Partial<Requirement>, newPhotosDataUrls: string[], remainingExistingPhotos: string[]) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    const requirementRef = doc(db, 'requirements', id);
    
    const requirementSnap = await getDoc(requirementRef);
    if (!requirementSnap.exists()) throw new Error("Requirement not found");
    const existingData = requirementSnap.data();

    // Handle photo deletions
    const photosToDelete = (existingData.photos || []).filter(url => !remainingExistingPhotos.includes(url));
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

    // Handle photo additions
    let newPhotoUrls: string[] = [];
    if (newPhotosDataUrls.length > 0) {
        newPhotoUrls = await uploadPhotos('requirements', auth.currentUser.uid, newPhotosDataUrls, id);
    }
    
    const finalPhotos = [...remainingExistingPhotos, ...newPhotoUrls];
    
    await updateDoc(requirementRef, {
        ...data,
        photos: finalPhotos,
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


export const updateRequirementStatus = async (id: string, status: 'Open' | 'Purchased', purchaseId?: string) => {
    const requirementRef = doc(db, 'requirements', id);
    const updateData: { status: typeof status, purchaseId?: string } = { status };
    if (purchaseId) {
        updateData.purchaseId = purchaseId;
    }
    await updateDoc(requirementRef, updateData);
};


// == QUOTATIONS ==

export const addQuotation = async (data) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const profileDocRef = doc(db, 'shopOwnerProfiles', auth.currentUser.uid);
    const profileDocSnap = await getDoc(profileDocRef);
    const profileData = profileDocSnap.data() as ShopOwnerProfile;
    
    const requirementSnap = await getDoc(doc(db, 'requirements', data.requirementId));
    const requirement = requirementSnap.data() as Requirement;


    const quotationData = {
        ...data,
        shopOwnerId: auth.currentUser.uid,
        shopOwnerName: profileData?.name || 'Anonymous',
        shopName: profileData?.shopName || 'Unnamed Shop',
        createdAt: serverTimestamp(),
    }
    const docRef = await addDoc(collection(db, 'quotations'), quotationData);
    
    // Create notification for homeowner
    await addDoc(collection(db, 'notifications'), {
        userId: requirement.homeownerId,
        message: `You received a new quote from ${quotationData.shopName} for '${requirement.title}'.`,
        link: `/homeowner/requirements/${data.requirementId}`,
        read: false,
        createdAt: serverTimestamp(),
        type: 'quote',
    });
    
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

export const addUpdate = async (data: { title: string, content: string }, photosDataUrls: string[] = []) => {
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
        imageUrls: [], // Initial empty value
    });
    
    if (photosDataUrls.length > 0) {
        const urls = await uploadPhotos('updates', auth.currentUser.uid, photosDataUrls, updateRef.id);
        if (urls.length > 0) {
            await updateDoc(updateRef, { imageUrls: urls });
        }
    }
    
    // Create notifications for all users
    const allUsersQuery = query(collection(db, 'users'));
    const allUsersSnapshot = await getDocs(allUsersQuery);
    const batch = writeBatch(db);

    allUsersSnapshot.forEach(userDoc => {
        // Don't notify the author of the update
        if (userDoc.id === auth.currentUser?.uid) return;

        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
            userId: userDoc.id,
            message: `New community update posted: "${data.title}"`,
            link: `/updates`,
            read: false,
            createdAt: serverTimestamp(),
            type: 'admin_update'
        });
    });

    await batch.commit();

    return updateRef.id;
}


export const updateUpdate = async (id: string, data: { title: string; content: string }, newPhotosDataUrls: string[], remainingExistingPhotos: string[]) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    const updateRef = doc(db, 'updates', id);

    const updateSnap = await getDoc(updateRef);
    if (!updateSnap.exists()) throw new Error("Update not found");
    const existingData = updateSnap.data();

    const photosToDelete = (existingData.imageUrls || []).filter((url: string) => !remainingExistingPhotos.includes(url));
    await Promise.all(photosToDelete.map(async (url: string) => {
        try {
            const photoRef = ref(storage, url);
            await deleteObject(photoRef);
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error("Failed to delete old photo:", error);
            }
        }
    }));
    
    let newPhotoUrls: string[] = [];
    if (newPhotosDataUrls.length > 0) {
        newPhotoUrls = await uploadPhotos('updates', auth.currentUser.uid, newPhotosDataUrls, id);
    }
    
    const finalPhotos = [...remainingExistingPhotos, ...newPhotoUrls];

    await updateDoc(updateRef, {
        ...data,
        imageUrls: finalPhotos,
    });
}


export const deleteUpdate = async (id: string, imageUrls?: string[]) => {
    const updateRef = doc(db, 'updates', id);
    await deleteDoc(updateRef);

    if (imageUrls && imageUrls.length > 0) {
         const deletePromises = imageUrls.map(url => {
            const imageRef = ref(storage, url);
            return deleteObject(imageRef).catch(error => {
                 if (error.code !== 'storage/object-not-found') {
                    console.error("Failed to delete post image:", error);
                }
            });
         });
         await Promise.all(deletePromises);
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

// == NOTIFICATIONS ==

export const markAllNotificationsAsRead = async (userId: string) => {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
};


// == ADMIN FUNCTIONS ==

export const getAllUsersByRole = async (role: UserRole): Promise<User[]> => {
    const usersQuery = query(collection(db, 'users'), where('role', '==', role));
    const usersSnapshot = await getDocs(usersQuery);
    const users: User[] = [];

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data() as User;
        const profileCollection = role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
        const profileDocRef = doc(db, profileCollection, userDoc.id);
        const profileSnap = await getDoc(profileDocRef);
        if (profileSnap.exists()) {
            userData.profile = profileSnap.data() as HomeownerProfile | ShopOwnerProfile;
        }
        users.push({ id: userDoc.id, ...userData });
    }
    return users;
};

export const createPurchase = async (requirement: Requirement, quotation: Quotation) => {
    const purchaseRef = await addDoc(collection(db, 'purchases'), {
        requirementId: requirement.id,
        homeownerId: requirement.homeownerId,
        shopOwnerId: quotation.shopOwnerId,
        quotationId: quotation.id,
        amount: quotation.amount,
        material: requirement.title,
        status: 'Purchased',
        homeownerName: requirement.homeownerName,
        shopOwnerName: quotation.shopOwnerName,
        createdAt: serverTimestamp(),
    });
    
    await updateRequirementStatus(requirement.id, 'Purchased', purchaseRef.id);

    // Create notification for shop owner about the purchase
    await addDoc(collection(db, 'notifications'), {
        userId: quotation.shopOwnerId,
        message: `Your quote for '${requirement.title}' was accepted by ${requirement.homeownerName}!`,
        link: `/shop-owner/my-quotations?filter=accepted`,
        read: false,
        createdAt: serverTimestamp(),
        type: 'purchase'
    });

    return purchaseRef;
};

export const getAllPurchases = async (): Promise<Purchase[]> => {
    const q = query(collection(db, "purchases"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
};

export const getPurchaseById = async (id: string): Promise<PurchaseWithDetails | undefined> => {
    const purchaseRef = doc(db, 'purchases', id);
    const purchaseSnap = await getDoc(purchaseRef);

    if (!purchaseSnap.exists()) {
        return undefined;
    }

    const purchase = { id: purchaseSnap.id, ...purchaseSnap.data() } as Purchase;

    const [requirement, quotation, homeowner, shopOwner] = await Promise.all([
        getRequirementById(purchase.requirementId),
        getQuotationById(purchase.quotationId),
        getHomeownerProfileById(purchase.homeownerId),
        getProfile(purchase.shopOwnerId),
    ]);

    return {
        ...purchase,
        requirement,
        quotation,
        homeowner,
        shopOwner
    };
};

// == REVIEWS ==

export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    if (!auth.currentUser) throw new Error("Not authenticated");
    if (auth.currentUser.uid !== reviewData.customerId) throw new Error("Cannot post review for another user.");
    
    const reviewPayload = {
      ...reviewData,
      createdAt: serverTimestamp()
    };
    
    return await addDoc(collection(db, 'reviews'), reviewPayload);
}

export const getReviewsByShopOwner = async (shopOwnerId: string): Promise<Review[]> => {
    const q = query(
        collection(db, 'reviews'),
        where('shopOwnerId', '==', shopOwnerId),
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
}

export const getReviewByPurchase = async (purchaseId: string, customerId: string, shopOwnerId: string): Promise<Review | undefined> => {
    const q = query(
        collection(db, 'reviews'),
        where('purchaseId', '==', purchaseId),
        where('customerId', '==', customerId),
        where('shopOwnerId', '==', shopOwnerId)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Review;
    }
    return undefined;
}
