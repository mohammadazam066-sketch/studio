

'use client';

import { useState, useEffect, createContext, useContext, Dispatch, SetStateAction } from 'react';
import type { Requirement, Quotation, ShopOwnerProfile, User, Update, HomeownerProfile } from './types';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, writeBatch, orderBy, deleteDoc, type QueryConstraint } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import type { Timestamp } from 'firebase/firestore';


// --- AUTH CONTEXT ---
interface AuthContextType {
  currentUser: User | null;
  setCurrentUser?: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  login: (username: string, pass: string) => Promise<UserCredential>;
  register: (username: string, pass: string, role: 'homeowner' | 'shop-owner') => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          let profileData;
          const profileCollection = userData.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
          profileData = await getDoc(doc(db, profileCollection, user.uid));

          if (profileData.exists()) {
              setCurrentUser({ ...userData, profile: { id: profileData.id, ...profileData.data() } });
          } else {
              console.warn(`Profile for user ${user.uid} not found in ${profileCollection} collection. Logging out.`);
              await signOut(auth);
              setCurrentUser(null);
          }
        } else {
            console.warn("User authenticated with Firebase, but no user record found in Firestore. Logging out.");
            await signOut(auth);
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string, pass: string) => {
    const email = `${username.toLowerCase()}@bidarkart.app`;
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const register = async (username: string, pass:string, role: 'homeowner' | 'shop-owner') => {
    const email = `${username.toLowerCase()}@bidarkart.app`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    const batch = writeBatch(db);

    const userDocRef = doc(db, 'users', user.uid);
    batch.set(userDocRef, { username, email, role, id: user.uid });

    if (role === 'shop-owner') {
        const profileDocRef = doc(db, "shopOwnerProfiles", user.uid);
        const newProfile: Omit<ShopOwnerProfile, 'id'> = {
            username,
            email,
            shopName: `${username}'s Shop`,
            phoneNumber: '',
            address: '',
            location: '',
            shopPhotos: [],
        };
        batch.set(profileDocRef, newProfile);
    } else if (role === 'homeowner') {
        const profileDocRef = doc(db, "homeownerProfiles", user.uid);
        const newProfile: Omit<HomeownerProfile, 'id'> = {
            username,
            email,
            phoneNumber: '',
            address: '',
        };
        batch.set(profileDocRef, newProfile);
    }
    
    await batch.commit();
    return userCredential;
  }

  const logout = () => {
    return signOut(auth);
  };

  const value = { currentUser, setCurrentUser, loading, login, register, logout };

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
    if (!userId) {
        console.error("getUser called with no userId");
        return undefined;
    }
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() } as User;
        }
        return undefined;
    } catch (error) {
        console.error("Error fetching user:", error);
        return undefined;
    }
};
    
export async function updateUser(userId: string, updatedDetails: Partial<Omit<User, 'id' | 'role' | 'password' | 'email' | 'profile'>>) {
    if (!userId) throw new Error("User ID is required to update user.");
    
    const user = await getUser(userId);
    if (!user) throw new Error("User not found");
    
    const batch = writeBatch(db);

    const userRef = doc(db, 'users', userId);
    batch.update(userRef, updatedDetails);
    
    const profileCollection = user.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
    const profileRef = doc(db, profileCollection, userId);
    batch.update(profileRef, { username: updatedDetails.username });

    await batch.commit();
}


export async function addRequirement(requirementData: Omit<Requirement, 'id' | 'createdAt' | 'homeownerId' | 'homeownerName' | 'status'>) {
    if (!auth.currentUser) throw new Error("User not authenticated");
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const userData = userDoc.data();

    if (!userData) throw new Error("User data not found in Firestore");
    
    const photoDataUrls = requirementData.photos;
    const uploadedPhotoUrls = await Promise.all(
        (photoDataUrls || []).map(async (dataUrl, index) => {
            const storageRef = ref(storage, `requirements/${auth.currentUser!.uid}/${Date.now()}-photo-${index}.jpg`);
            await uploadString(storageRef, dataUrl, 'data_url', { contentType: 'image/jpeg' });
            return getDownloadURL(storageRef);
        })
    );

    const fullRequirementData: Omit<Requirement, 'id'> = {
        title: requirementData.title,
        category: requirementData.category,
        location: requirementData.location,
        description: requirementData.description,
        homeownerId: auth.currentUser.uid,
        homeownerName: userData.username || 'Anonymous',
        status: 'Open',
        photos: uploadedPhotoUrls,
        createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'requirements'), fullRequirementData);
    return docRef.id;
}


export async function updateRequirement(
    requirementId: string, 
    updateData: Partial<Omit<Requirement, 'id' | 'createdAt' | 'homeownerId' | 'homeownerName' | 'status' | 'photos'>>, 
    newPhotosState: (string | { file: File, preview: string })[], 
    originalPhotoUrls: string[]
) {
    if (!auth.currentUser) throw new Error("User not authenticated");
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
        const storageRef = ref(storage, `requirements/${auth.currentUser!.uid}/${requirementId}-${Date.now()}-${index}.jpg`);
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
    if (!auth.currentUser) throw new Error("User not authenticated");

    const batch = writeBatch(db);
    const requirementRef = doc(db, 'requirements', requirementId);
    
    const reqDoc = await getDoc(requirementRef);
    if (!reqDoc.exists()) throw new Error("Requirement not found");
    
    const requirement = reqDoc.data() as Requirement;
    
    if (requirement.homeownerId !== auth.currentUser.uid) {
        throw new Error("User does not have permission to delete this requirement.");
    }

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
    if (!auth.currentUser) throw new Error("User not authenticated");
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
    const q = query(collection(db, 'quotations'), where('shopOwnerId', '==', shopOwnerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
}


export async function getProfile(userId: string): Promise<ShopOwnerProfile | HomeownerProfile | undefined> {
    if (!userId) {
        console.error("getProfile called with no userId");
        return undefined;
    }

    let profileDoc = await getDoc(doc(db, "shopOwnerProfiles", userId));
    if (profileDoc.exists()) {
        return { id: profileDoc.id, ...profileDoc.data() } as ShopOwnerProfile;
    }

    profileDoc = await getDoc(doc(db, "homeownerProfiles", userId));
     if (profileDoc.exists()) {
        return { id: profileDoc.id, ...profileDoc.data() } as HomeownerProfile;
    }
    
    return undefined;
};

export async function updateProfile(updatedProfileData: Omit<ShopOwnerProfile, 'id'>, newPhotosState: (string | { file: File, preview: string })[]) {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const profileId = auth.currentUser.uid;
    const existingProfile = await getProfile(profileId) as ShopOwnerProfile;
    
    const existingUrlsToKeep = newPhotosState.filter((p): p is string => typeof p === 'string');
    const newPhotoFiles = newPhotosState.filter((p): p is { file: File; preview: string } => typeof p !== 'string');
    
    const originalPhotoUrls = existingProfile?.shopPhotos || [];
    const urlsToDelete = originalPhotoUrls.filter(url => !existingUrlsToKeep.includes(url));

    const deletionPromises = urlsToDelete.map(url => deleteObject(ref(storage, url)).catch(err => console.error("Old photo deletion failed:", err)));
    
    const uploadPromises = newPhotoFiles.map(async (photoState) => {
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(photoState.file);
        });
        const storageRef = ref(storage, `profiles/${profileId}/${Date.now()}.jpg`);
        await uploadString(storageRef, dataUrl, 'data_url', { contentType: 'image/jpeg' });
        return getDownloadURL(storageRef);
    });

    const newUploadedUrls = await Promise.all(uploadPromises);
    await Promise.all(deletionPromises);

    const finalPhotoUrls = [...existingUrlsToKeep, ...newUploadedUrls];

    const profileToUpdate: Omit<ShopOwnerProfile, 'id'> = {
        ...updatedProfileData,
        shopPhotos: finalPhotoUrls,
    };
    
    const batch = writeBatch(db);

    const profileDocRef = doc(db, "shopOwnerProfiles", profileId);
    batch.set(profileDocRef, profileToUpdate, { merge: true });

    const userDocRef = doc(db, "users", profileId);
    batch.update(userDocRef, { username: updatedProfileData.username });
    
    await batch.commit();
};


// --- UPDATES FEED FUNCTIONS ---

export async function addUpdate(newUpdate: Omit<Update, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorRole'> & { imageUrl?: string }) {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const userData = userDoc.data() as User;
    if (!userData) throw new Error("User data not found in Firestore");

    let finalImageUrl = newUpdate.imageUrl;
    if (newUpdate.imageUrl) {
        const storageRef = ref(storage, `updates/${auth.currentUser!.uid}/${Date.now()}.jpg`);
        await uploadString(storageRef, newUpdate.imageUrl, 'data_url', { contentType: 'image/jpeg' });
        finalImageUrl = await getDownloadURL(storageRef);
    }

    const updateToAdd = {
      title: newUpdate.title,
      content: newUpdate.content,
      imageUrl: finalImageUrl || '',
      authorId: auth.currentUser.uid,
      authorName: userData.username,
      authorRole: userData.role,
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
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  const updateRef = doc(db, 'updates', updateId);
  const dataToUpdate: any = { ...updateData };

  if (newImage && newImage.dataUrl) {
    if (newImage.oldImageUrl) {
        try {
            const oldImageRef = ref(storage, newImage.oldImageUrl);
            await deleteObject(oldImageRef);
        } catch (error) {
            console.error("Failed to delete old image, continuing update.", error);
        }
    }
    const newImageRef = ref(storage, `updates/${auth.currentUser.uid}/${Date.now()}.jpg`);
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
    if (!auth.currentUser) throw new Error("User not authenticated");
    
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

    
