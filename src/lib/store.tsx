

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, HomeownerProfile, ShopOwnerProfile, Requirement, Quotation, Update, QuotationWithRequirement, Purchase, PurchaseWithDetails, Notification, Review } from './types';
import { db, storage, auth as firebaseAuth } from './firebase';
import { 
    doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
    collection, query, where, getDocs, serverTimestamp, orderBy, writeBatch, onSnapshot
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { logoutUser } from './auth';
import { onAuthStateChanged, deleteUser, signInWithPopup, GoogleAuthProvider, Unsubscribe } from 'firebase/auth';

let categoryCountCache: Record<string, number> | null = null;
let categoryCountCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// --- AUTH CONTEXT & PROVIDER ---

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserProfile: (updatedProfile: Partial<HomeownerProfile | ShopOwnerProfile> & { photosToKeep?: string[], newIcon?: string }, newPhotos?: string[]) => Promise<void>;
  handleNewUser: (user: import('firebase/auth').User, role: UserRole) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const adminUids: string[] = ['OmP2c8syLshm2F7KXj4cRT9UJsr1'];
    let unsubscribeUser: Unsubscribe | null = null;
    let unsubscribeProfile: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
        // 1. Immediate Cleanup of previous listeners on auth change
        if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
        if (unsubscribeProfile) { unsubscribeProfile(); unsubscribeProfile = null; }

        if (user) {
            const isDesignatedAdmin = adminUids.includes(user.uid);

            if (isDesignatedAdmin) {
                const adminDocRef = doc(db, 'users', user.uid);
                const adminDocSnap = await getDoc(adminDocRef);
                let adminData: Partial<User>;
                if (!adminDocSnap.exists()) {
                     adminData = {
                        id: user.uid,
                        phoneNumber: user.phoneNumber || 'N/A',
                        role: 'admin',
                        createdAt: serverTimestamp(),
                        profile: {
                            name: 'Admin',
                            phoneNumber: user.phoneNumber,
                            email: user.email,
                        }
                    };
                    await setDoc(adminDocRef, adminData);
                } else {
                    adminData = { ...adminDocSnap.data(), role: 'admin' };
                    if (adminDocSnap.data().role !== 'admin') {
                        await updateDoc(adminDocRef, { role: 'admin' });
                    }
                }
                setCurrentUser(adminData as User);
                setLoading(false);
            } else {
                const userDocRef = doc(db, 'users', user.uid);
                
                // 2. Listen to User Document
                unsubscribeUser = onSnapshot(userDocRef, (userDocSnap) => {
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as Omit<User, 'id' | 'profile'>;

                        // 3. IMPORTANT: Clean up the OLD profile listener before starting a NEW one
                        if (unsubscribeProfile) {
                            unsubscribeProfile();
                            unsubscribeProfile = null;
                        }

                        const profileCollection = userData.role === 'homeowner' 
                            ? 'homeownerProfiles' 
                            : 'shopOwnerProfiles';
                        const profileDocRef = doc(db, profileCollection, user.uid);

                        unsubscribeProfile = onSnapshot(profileDocRef, (profileDocSnap) => {
                            const profileData = profileDocSnap.exists() 
                                ? { id: profileDocSnap.id, ...profileDocSnap.data() } as (HomeownerProfile | ShopOwnerProfile) 
                                : undefined;
                            
                            setCurrentUser({ id: user.uid, ...userData, profile: profileData });
                            setLoading(false);
                        });
                    } else {
                        // User is authenticated but has no record in 'users' collection yet
                        setCurrentUser(null);
                        setLoading(false);
                    }
                }, (error) => {
                    console.error("Error listening to user document:", error);
                    setCurrentUser(null);
                    setLoading(false);
                });
            }
        } else {
            // No user is signed in
            setCurrentUser(null);
            setLoading(false);
        }
    });

    // Final cleanup on component unmount
    return () => {
        unsubscribeAuth();
        if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);


  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
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
            uploadedUrls = await uploadPhotos(newPhotosDataUrls, {type: 'shop', userId: currentUser.id});
        } else if (currentUser.role === 'homeowner' && newPhotosDataUrls.length === 1) {
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
            uploadedUrls = await uploadPhotos(newPhotosDataUrls, { type: 'profile', userId: currentUser.id });
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
        const [iconUrl] = await uploadPhotos([newIconDataUrl], {type: 'shop', userId: currentUser.id, subfolder: 'icon'});
        finalProfileData.shopIconUrl = iconUrl;
    }

    // Add photo URLs to the correct field based on role
    if(currentUser.role === 'shop-owner') {
        const existingPhotos = updatedProfileData.photosToKeep || [];
        finalProfileData.shopPhotos = [...existingPhotos, ...uploadedUrls];
    } else if (currentUser.role === 'homeowner' && uploadedUrls.length > 0) {
        finalProfileData.photoURL = uploadedUrls[0];
    }

    // Update the profile. The onSnapshot listener will automatically update the currentUser state.
    await setDoc(profileDocRef, finalProfileData, { merge: true });
    
    if (finalProfileData.name && finalProfileData.name !== currentUser.profile?.name) {
        const userDocRef = doc(db, 'users', currentUser.id);
        const userDoc = await getDoc(userDocRef);
        if(userDoc.exists()) {
             // Future improvement logic
        }
    }
  };

  const handleNewUser = async (user: import('firebase/auth').User, role: UserRole) => {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        console.warn("User profile already exists for uid:", user.uid);
        return; 
      }
      
      const defaultName = user.displayName || `User ${user.uid.slice(0, 5)}`;
      const phoneNumber = user.phoneNumber || '';

      const userDataForDb = {
        id: user.uid,
        phoneNumber: phoneNumber,
        role: role,
        email: user.email || '',
        createdAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, userDataForDb);
  
      const profileCollection = role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
      const profileDocRef = doc(db, profileCollection, user.uid);
      
      let profileData: HomeownerProfile | ShopOwnerProfile;
  
      if (role === 'shop-owner') {
        profileData = {
            id: user.uid,
            name: defaultName,
            phoneNumber: phoneNumber,
            email: user.email || '',
            shopName: `${defaultName}'s Shop`,
            address: '',
            location: '',
            shopPhotos: [],
            shopIconUrl: user.photoURL || '',
            createdAt: serverTimestamp(),
        };
      } else {
        profileData = {
            id: user.uid,
            name: defaultName,
            phoneNumber: phoneNumber,
            email: user.email || '',
            address: '',
            occupation: '',
            photoURL: user.photoURL || '',
            createdAt: serverTimestamp(),
        };
      }
      
      await setDoc(profileDocRef, profileData, { merge: true });
      // No need to manually set user state here, the onSnapshot listener will pick it up.
  }

  const deleteUserAccount = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) throw new Error("User data not found in Firestore.");
    
    const userData = userDocSnap.data();
    const role = userData.role;

    const profileCollection = role === 'homeowner' 
        ? 'homeownerProfiles' 
        : role === 'shop-owner'
        ? 'shopOwnerProfiles'
        : null;

    const batch = writeBatch(db);
    batch.delete(userDocRef);
    if (profileCollection) {
        const profileDocRef = doc(db, profileCollection, user.uid);
        batch.delete(profileDocRef);
    }
    
    await batch.commit();
    await deleteUser(user);
  };

  const value = {
    currentUser,
    loading,
    logout,
    updateUserProfile,
    handleNewUser,
    deleteUserAccount,
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

type UploadPathConfig = 
  | { type: 'requirement'; userId: string; requirementId: string }
  | { type: 'update'; userId: string; updateId: string; }
  | { type: 'profile'; userId: string }
  | { type: 'shop'; userId: string, subfolder?: 'icon' | 'photos' };

const uploadPhotos = async (photosDataUrls: string[], pathConfig: UploadPathConfig): Promise<string[]> => {
    const urls = await Promise.all(
        photosDataUrls.map(async (dataUrl) => {
            let path: string;
            const uniquePart = `${Date.now()}-${Math.random()}`;
            switch(pathConfig.type) {
                case 'requirement':
                    path = `requirements/${pathConfig.userId}/${pathConfig.requirementId}/${uniquePart}`;
                    break;
                case 'update':
                     path = `updates/${pathConfig.userId}/${pathConfig.updateId}/${uniquePart}`;
                    break;
                case 'profile':
                    path = `homeownerProfiles/${pathConfig.userId}/${uniquePart}`;
                    break;
                case 'shop':
                    const sub = pathConfig.subfolder || 'photos';
                    path = `shopOwnerProfiles/${pathConfig.userId}/${sub}/${uniquePart}`;
                    break;
                default:
                    throw new Error("Invalid upload path configuration");
            }
            
            const photoRef = ref(storage, path);
            await uploadString(photoRef, dataUrl, 'data_url');
            return getDownloadURL(photoRef);
        })
    );
    return urls;
}

export const addRequirement = async (data, photosDataUrls: string[]) => {
    if (!firebaseAuth.currentUser) throw new Error("User not authenticated");
    
    const userDocRef = doc(db, 'users', firebaseAuth.currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.data() as User;

    const profileDocRef = doc(db, 'homeownerProfiles', firebaseAuth.currentUser.uid);
    const profileDocSnap = await getDoc(profileDocRef);
    const profileData = profileDocSnap.data() as HomeownerProfile;

    const requirementRef = await addDoc(collection(db, 'requirements'), {
        ...data,
        homeownerId: firebaseAuth.currentUser.uid,
        homeownerName: profileData?.name || userData?.phoneNumber || 'Anonymous',
        createdAt: serverTimestamp(),
        status: 'Open',
        photos: [],
    });

    const photoUrls = await uploadPhotos(photosDataUrls, { type: 'requirement', userId: firebaseAuth.currentUser.uid, requirementId: requirementRef.id });
    await updateDoc(requirementRef, { photos: photoUrls });
    
    // Optimized: Query profiles directly by location.
    const shopProfilesQuery = query(
        collection(db, 'shopOwnerProfiles'),
        where("location", "==", data.location)
    );
    const shopProfilesSnapshot = await getDocs(shopProfilesQuery);
    
    if (shopProfilesSnapshot.empty) {
        return requirementRef.id;
    }

    const batch = writeBatch(db);
    shopProfilesSnapshot.forEach(profileDoc => {
        const userId = profileDoc.id; // The profile doc ID is the user ID
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
            userId: userId,
            message: `New requirement '${data.title}' posted in ${data.location}.`,
            link: `/shop-owner/requirements/${requirementRef.id}`,
            read: false,
            createdAt: serverTimestamp(),
            type: 'requirement'
        });
    });

    await batch.commit();
    return requirementRef.id;
}

export const updateRequirement = async (id: string, data: Partial<Requirement>, newPhotosDataUrls: string[], remainingExistingPhotos: string[]) => {
    if (!firebaseAuth.currentUser) throw new Error("User not authenticated");
    const requirementRef = doc(db, 'requirements', id);
    
    const requirementSnap = await getDoc(requirementRef);
    if (!requirementSnap.exists()) throw new Error("Requirement not found");
    const existingData = requirementSnap.data();

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

    let newPhotoUrls: string[] = [];
    if (newPhotosDataUrls.length > 0) {
        newPhotoUrls = await uploadPhotos(newPhotosDataUrls, {type: 'requirement', userId: firebaseAuth.currentUser.uid, requirementId: id});
    }
    
    const finalPhotos = [...remainingExistingPhotos, ...newPhotoUrls];
    await updateDoc(requirementRef, {
        ...data,
        photos: finalPhotos,
    });
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
    const q = query(
        collection(db, "requirements"), 
        where("homeownerId", "==", homeownerId),
    );
    const querySnapshot = await getDocs(q);
    const requirements = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Requirement))
        .filter(req => req.status !== 'Deleted');
    
    return requirements.sort((a, b) => {
        if (a.status === 'Open' && b.status !== 'Open') return -1;
        if (a.status !== 'Open' && b.status === 'Open') return 1;
        const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(0);
        const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
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

    return requirements.sort((a, b) => {
        const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(0);
        const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
}

export const getOpenRequirementsCountByCategory = async (): Promise<Record<string, number>> => {
    const now = Date.now();

    // If we have a fresh cache, use it instead of calling Firebase
    if (categoryCountCache && (now - categoryCountCacheTime) < CACHE_DURATION) {
        return categoryCountCache;
    }

    const q = query(collection(db, "requirements"), where("status", "==", "Open"));
    const querySnapshot = await getDocs(q);
    const counts: Record<string, number> = {};
    
    querySnapshot.forEach(doc => {
        const requirement = doc.data() as Requirement;
        if (requirement.category) {
            counts[requirement.category] = (counts[requirement.category] || 0) + 1;
        }
    });

    categoryCountCache = counts;
    categoryCountCacheTime = now;
    return counts;
};

export const updateRequirementStatus = async (id: string, status: 'Open' | 'Purchased' | 'Deleted', data: Partial<Requirement> = {}) => {
    const requirementRef = doc(db, 'requirements', id);
    await updateDoc(requirementRef, { ...data, status });
    categoryCountCache = null;
};

export const addQuotation = async (data) => {
    if (!firebaseAuth.currentUser) throw new Error("User not authenticated");
    
    const profileDocRef = doc(db, 'shopOwnerProfiles', firebaseAuth.currentUser.uid);
    const profileDocSnap = await getDoc(profileDocRef);
    const profileData = profileDocSnap.data() as ShopOwnerProfile;
    
    const requirementSnap = await getDoc(doc(db, 'requirements', data.requirementId));
    const requirement = requirementSnap.data() as Requirement;

    const { materialAmount, transportationCharges, ...restData } = data;

    const quotationData = {
        ...restData,
        materialAmount: materialAmount || 0,
        transportationCharges: transportationCharges || 0,
        totalAmount: (materialAmount || 0) + (transportationCharges || 0),
        shopOwnerId: firebaseAuth.currentUser.uid,
        shopOwnerName: profileData?.name || 'Anonymous',
        shopName: profileData?.shopName || 'Unnamed Shop',
        createdAt: serverTimestamp(),
    }
    const docRef = await addDoc(collection(db, 'quotations'), quotationData);
    
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
    const { materialAmount, transportationCharges, ...restData } = data;
    const submissionData = {
        ...restData,
        materialAmount: materialAmount || 0,
        transportationCharges: transportationCharges || 0,
        totalAmount: (materialAmount || 0) + (transportationCharges || 0),
    };
    await updateDoc(quotationRef, submissionData);
}

export const deleteQuotation = async (id: string) => {
    if (!firebaseAuth.currentUser) throw new Error("User not authenticated");
    const quotationRef = doc(db, 'quotations', id);
    const quoteSnap = await getDoc(quotationRef);
    if (quoteSnap.exists() && quoteSnap.data().shopOwnerId === firebaseAuth.currentUser.uid) {
        await deleteDoc(quotationRef);
    } else {
        throw new Error("Quotation not found or user not authorized to delete it.");
    }
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
    
    return quotations.sort((a, b) => {
        const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(0);
        const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(0);
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

export const getProfile = async (userId: string): Promise<ShopOwnerProfile | undefined> => {
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

export const addUpdate = async (data: { title: string, content: string }, photosDataUrls: string[] = []) => {
    if (!firebaseAuth.currentUser) throw new Error("User not authenticated");
    
    const userDocSnap = await getDoc(doc(db, 'users', firebaseAuth.currentUser.uid));
    if(!userDocSnap.exists()) throw new Error("User not found");
    const userData = userDocSnap.data() as User;
    const profileCollection = userData.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
    const profileDocSnap = await getDoc(doc(db, profileCollection, firebaseAuth.currentUser.uid));
    const profileData = profileDocSnap.data();

    const updateRef = await addDoc(collection(db, 'updates'), {
        ...data,
        authorId: firebaseAuth.currentUser.uid,
        authorName: profileData?.name || userData.phoneNumber,
        authorRole: userData.role,
        createdAt: serverTimestamp(),
        imageUrls: [],
    });

    const photoUrls = await uploadPhotos(photosDataUrls, { type: 'update', userId: firebaseAuth.currentUser.uid, updateId: updateRef.id });
    await updateDoc(updateRef, { imageUrls: photoUrls });
}

export const updateUpdate = async (id: string, data: { title: string; content: string }, newPhotosDataUrls: string[], remainingExistingPhotos: string[]) => {
    if (!firebaseAuth.currentUser) throw new Error("User not authenticated");
    const updateRef = doc(db, 'updates', id);

    const updateSnap = await getDoc(updateRef);
    if (!updateSnap.exists()) throw new Error("Update not found");
    const existingData = updateSnap.data();

    const photosToDelete = (existingData.imageUrls || []).filter(url => !remainingExistingPhotos.includes(url));
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

    const newPhotoUrls = await uploadPhotos(newPhotosDataUrls, { type: 'update', userId: firebaseAuth.currentUser.uid, updateId: id });
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
        await Promise.all(imageUrls.map(async (url) => {
            try {
                const photoRef = ref(storage, url);
                await deleteObject(photoRef);
            } catch (error: any) {
                if (error.code !== 'storage/object-not-found') {
                    console.error("Failed to delete update photo:", error);
                }
            }
        }));
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
        const data = docSnap.data();
        if (data.status === 'Deleted') return undefined;
        return { id: docSnap.id, ...data } as Update;
    }
    return undefined;
}

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

export const getAllUsersByRole = async (role: UserRole): Promise<User[]> => {
    const usersQuery = query(collection(db, 'users'), where('role', '==', role));
    const usersSnapshot = await getDocs(usersQuery);

    const users = await Promise.all(usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data() as Omit<User, 'id' | 'profile'>;
        const profileCollection = role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
        const profileDocRef = doc(db, profileCollection, userDoc.id);
        const profileSnap = await getDoc(profileDocRef);
        
        const profile = profileSnap.exists() ? profileSnap.data() as HomeownerProfile | ShopOwnerProfile : undefined;
        
        return { id: userDoc.id, ...userData, profile } as User;
    }));

    return users;
};

export const createPurchase = async (requirement: Requirement, quotation: Quotation) => {
    const purchaseRef = await addDoc(collection(db, 'purchases'), {
        requirementId: requirement.id,
        homeownerId: requirement.homeownerId,
        shopOwnerId: quotation.shopOwnerId,
        quotationId: quotation.id,
        amount: quotation.totalAmount,
        material: requirement.title,
        status: 'Purchased',
        homeownerName: requirement.homeownerName,
        shopOwnerName: quotation.shopOwnerName,
        createdAt: serverTimestamp(),
    });
    
    await updateRequirementStatus(requirement.id, 'Purchased', { 
        purchaseId: purchaseRef.id,
        quotationId: quotation.id,
     });

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
    if (!purchaseSnap.exists()) return undefined;

    const purchase = { id: purchaseSnap.id, ...purchaseSnap.data() } as Purchase;
    const [requirement, quotation, homeowner, shopOwner] = await Promise.all([
        getRequirementById(purchase.requirementId),
        getQuotationById(purchase.quotationId),
        getHomeownerProfileById(purchase.homeownerId),
        getProfile(purchase.shopOwnerId),
    ]);

    return { ...purchase, requirement, quotation, homeowner, shopOwner };
};

export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    if (!firebaseAuth.currentUser) throw new Error("Not authenticated");
    if (firebaseAuth.currentUser.uid !== reviewData.customerId) throw new Error("Unauthorized review.");
    
    return await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        createdAt: serverTimestamp()
    });
}

export const updateReview = async (reviewId: string, data: { rating: number; comment: string }) => {
    if (!firebaseAuth.currentUser) throw new Error("Not authenticated");
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    if (!reviewSnap.exists() || reviewSnap.data().customerId !== firebaseAuth.currentUser.uid) {
        throw new Error("Unauthorized review edit.");
    }
    return await updateDoc(reviewRef, { rating: data.rating, comment: data.comment });
}

export const getReviewsByShopOwner = async (shopOwnerId: string): Promise<Review[]> => {
    const q = query(collection(db, 'reviews'), where('shopOwnerId', '==', shopOwnerId));
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    
    return reviews.sort((a, b) => {
        const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date();
        const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date();
        return dateB.getTime() - dateA.getTime();
    });
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
};
    



    

    



    





    
