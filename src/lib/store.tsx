
'use client';

import { useState, useEffect, createContext, useContext, Dispatch, SetStateAction } from 'react';
import type { Requirement, Quotation, ShopOwnerProfile, User } from './types';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, Timestamp, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";

// --- AUTH CONTEXT ---
interface AuthContextType {
  currentUser: User | null;
  setCurrentUser?: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  login: (email: string, pass: string, role: 'homeowner' | 'shop-owner') => Promise<UserCredential>;
  register: (name: string, email: string, pass: string, role: 'homeowner' | 'shop-owner') => Promise<UserCredential>;
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
          setCurrentUser({ id: user.uid, ...userDoc.data() } as User);
        } else {
            // This case might happen if the user exists in Auth but not in Firestore.
            // For this app, we'll log them out as a safeguard, but the login/register flow should handle creation.
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

  const login = async (email: string, pass: string, role: 'homeowner' | 'shop-owner') => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    // After successful sign-in, ensure the user document exists in Firestore.
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // User is in Auth but not Firestore. Let's create their records.
      const batch = writeBatch(db);
      
      // Use email as a fallback for the name if not available
      const name = user.displayName || user.email || 'New User';

      batch.set(userDocRef, { name, email, role });

      if (role === 'shop-owner') {
        const profileDocRef = doc(db, "shopOwnerProfiles", user.uid);
        const newProfile: Omit<ShopOwnerProfile, 'id'> = {
          name,
          shopName: `${name}'s Shop`,
          phoneNumber: '',
          address: '',
          location: '',
          shopPhotos: [],
        };
        batch.set(profileDocRef, newProfile);
      }
      
      await batch.commit();
    }
    
    return userCredential;
  };
  
  const register = async (name: string, email: string, pass: string, role: 'homeowner' | 'shop-owner') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    // Use a batch write to create user and profile atomically
    const batch = writeBatch(db);

    const userDocRef = doc(db, 'users', user.uid);
    batch.set(userDocRef, { name, email, role });

    // Create an empty profile for shop owners
    if (role === 'shop-owner') {
        const profileDocRef = doc(db, "shopOwnerProfiles", user.uid);
        const newProfile: Omit<ShopOwnerProfile, 'id'> = {
            name,
            shopName: `${name}'s Shop`,
            phoneNumber: '',
            address: '',
            location: '',
            shopPhotos: [],
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
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return undefined;
};
    
export async function updateUser(userId: string, updatedDetails: Partial<Omit<User, 'id' | 'role' | 'password'>>) {
    return updateDoc(doc(db, 'users', userId), updatedDetails);
}


export async function addRequirement(newRequirement: Omit<Requirement, 'id' | 'createdAt' | 'homeownerId' | 'homeownerName' | 'status'>) {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const userData = userDoc.data();
    if (!userData) throw new Error("User data not found in Firestore");

    const photoURLs = await Promise.all(
        newRequirement.photos.map(async (photoDataUrl, index) => {
            if (photoDataUrl.startsWith('https')) return photoDataUrl;
            const storageRef = ref(storage, `requirements/${auth.currentUser!.uid}-${Date.now()}-${index}.jpg`);
            await uploadString(storageRef, photoDataUrl, 'data_url', { contentType: 'image/jpeg' });
            return getDownloadURL(storageRef);
        })
    );

    const requirementToAdd = {
      ...newRequirement,
      photos: photoURLs,
      homeownerId: auth.currentUser.uid,
      homeownerName: userData.name || 'Anonymous',
      createdAt: serverTimestamp(),
      status: 'Open',
    };
    
    const docRef = await addDoc(collection(db, 'requirements'), requirementToAdd);
    return docRef.id;
}
  
export async function updateRequirementStatus(requirementId: string, status: 'Open' | 'Purchased') {
    return updateDoc(doc(db, 'requirements', requirementId), { status });
}

export async function getRequirements(filters: { homeownerId?: string; status?: 'Open' | 'Purchased' } = {}) {
    let q = query(collection(db, 'requirements'));
    if (filters.homeownerId) {
        q = query(q, where('homeownerId', '==', filters.homeownerId));
    }
    if (filters.status) {
        q = query(q, where('status', '==', filters.status));
    }

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
  
export async function getQuotationsForRequirement(requirementId: string) {
    const q = query(collection(db, 'quotations'), where('requirementId', '==', requirementId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
};


export async function getProfile(shopOwnerId: string): Promise<ShopOwnerProfile | undefined> {
    if (!shopOwnerId) {
        console.error("getProfile called with no shopOwnerId");
        return undefined;
    }
    const docRef = doc(db, "shopOwnerProfiles", shopOwnerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ShopOwnerProfile;
    }
    return undefined;
};

export async function updateProfile(updatedProfileData: Omit<ShopOwnerProfile, 'id'| 'shopPhotos'> & { shopPhotos: (string | { file: File, preview: string })[] }) {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const profileId = auth.currentUser.uid;
    const existingProfile = await getProfile(profileId);
    
    // Process photos: upload new ones, keep existing ones
    const newPhotoUrls = await Promise.all(
        updatedProfileData.shopPhotos.map(async (photo, index) => {
            if (typeof photo === 'string') {
                return photo; // It's an existing URL, keep it.
            }
            // It's a new file to upload.
            const storageRef = ref(storage, `profiles/${profileId}/shop-photo-${Date.now()}-${index}`);
            // photo.preview is a data URL (e.g., from URL.createObjectURL)
            const response = await fetch(photo.preview);
            const blob = await response.blob();
            await uploadString(storageRef, photo.preview, 'data_url', { contentType: blob.type });
            return getDownloadURL(storageRef);
        })
    );

    // Identify and delete photos that were removed from the UI
    const existingUrls = existingProfile?.shopPhotos || [];
    const removedUrls = existingUrls.filter(url => !newPhotoUrls.includes(url));
    await Promise.all(removedUrls.map(url => {
        try {
            const photoRef = ref(storage, url);
            return deleteObject(photoRef);
        } catch (error) {
            console.error("Failed to delete old photo, it might have already been removed:", url, error);
            return Promise.resolve();
        }
    }));

    const profileToUpdate = {
        name: updatedProfileData.name,
        shopName: updatedProfileData.shopName,
        phoneNumber: updatedProfileData.phoneNumber,
        address: updatedProfileData.address,
        location: updatedProfileData.location,
        shopPhotos: newPhotoUrls,
    };

    return setDoc(doc(db, "shopOwnerProfiles", profileId), profileToUpdate, { merge: true });
};
