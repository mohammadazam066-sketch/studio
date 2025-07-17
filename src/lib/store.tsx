
'use client';

import { useState, useEffect, createContext, useContext, Dispatch, SetStateAction } from 'react';
import type { Requirement, Quotation, ShopOwnerProfile, User, Update } from './types';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';
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
          setCurrentUser({ id: user.uid, ...userDoc.data() } as User);
        } else {
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
    const email = `${username.toLowerCase()}@tradeflow.app`;
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential;
  };
  
  const register = async (username: string, pass:string, role: 'homeowner' | 'shop-owner') => {
    const email = `${username.toLowerCase()}@tradeflow.app`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    const batch = writeBatch(db);

    const userDocRef = doc(db, 'users', user.uid);
    batch.set(userDocRef, { username, email, role });

    if (role === 'shop-owner') {
        const profileDocRef = doc(db, "shopOwnerProfiles", user.uid);
        const newProfile: Omit<ShopOwnerProfile, 'id'> = {
            username,
            shopName: `${username}'s Shop`,
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
    if (!userId) return undefined;
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return undefined;
};
    
export async function updateUser(userId: string, updatedDetails: Partial<Omit<User, 'id' | 'role' | 'password' | 'email'>>) {
    if (!userId) throw new Error("User ID is required to update user.");
    return updateDoc(doc(db, 'users', userId), updatedDetails);
}


export async function addRequirement(newRequirement: Omit<Requirement, 'id' | 'createdAt' | 'homeownerId' | 'homeownerName' | 'status'>) {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const userData = userDoc.data();
    if (!userData) throw new Error("User data not found in Firestore");

    const photoURLs = await Promise.all(
        newRequirement.photos.map(async (photoDataUrl, index) => {
            const storageRef = ref(storage, `requirements/${auth.currentUser!.uid}/${Date.now()}-${index}.jpg`);
            await uploadString(storageRef, photoDataUrl, 'data_url', { contentType: 'image/jpeg' });
            return getDownloadURL(storageRef);
        })
    );

    const requirementToAdd = {
      ...newRequirement,
      photos: photoURLs,
      homeownerId: auth.currentUser.uid,
      homeownerName: userData.username || 'Anonymous',
      createdAt: serverTimestamp(),
      status: 'Open',
    };
    
    const docRef = await addDoc(collection(db, 'requirements'), requirementToAdd);
    return docRef.id;
}
  
export async function updateRequirementStatus(requirementId: string, status: 'Open' | 'Purchased', purchasedQuote?: Quotation) {
    const dataToUpdate: { status: string; purchasedQuote?: any } = { status };
    if (status === 'Purchased' && purchasedQuote) {
        dataToUpdate.purchasedQuote = {
            id: purchasedQuote.id,
            shopOwnerId: purchasedQuote.shopOwnerId,
            shopOwnerName: purchasedQuote.shopOwnerName,
            shopName: purchasedQuote.shopName,
            amount: purchasedQuote.amount,
        };
    }
    return updateDoc(doc(db, 'requirements', requirementId), dataToUpdate);
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
    const q = query(collection(db, 'quotations'), where('requirementId', '==', requirementId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
};

export async function getQuotationsByShopOwner(shopOwnerId: string) {
    const q = query(collection(db, 'quotations'), where('shopOwnerId', '==', shopOwnerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
}


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

export async function updateProfile(updatedProfileData: Omit<ShopOwnerProfile, 'id'>) {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const profileId = auth.currentUser.uid;
    const existingProfile = await getProfile(profileId);
    
    // Process new photos for upload and keep track of existing URLs
    const newFinalUrls: string[] = [];
    const photoUploadPromises = (updatedProfileData.shopPhotos || []).map(async (photoData, index) => {
        // If it's already a URL, it's an existing photo. Keep it.
        if (typeof photoData === 'string' && photoData.startsWith('https://')) {
            newFinalUrls.push(photoData);
            return;
        }
        // Otherwise, it's a new data URI to upload.
        const storageRef = ref(storage, `profiles/${profileId}/${Date.now()}-${index}.jpg`);
        const uploadResult = await uploadString(storageRef, photoData as string, 'data_url');
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        newFinalUrls.push(downloadUrl);
    });

    await Promise.all(photoUploadPromises);

    // Delete photos that were removed in the UI
    const existingUrls = existingProfile?.shopPhotos || [];
    const removedUrls = existingUrls.filter(url => !newFinalUrls.includes(url));
    await Promise.all(removedUrls.map(url => {
        try {
            const photoRef = ref(storage, url);
            return deleteObject(photoRef);
        } catch (error) {
            console.error("Failed to delete old photo:", url, error);
            return Promise.resolve(); // Don't block the update if deletion fails
        }
    }));

    const profileToUpdate: Omit<ShopOwnerProfile, 'id'> = {
        ...updatedProfileData,
        shopPhotos: newFinalUrls,
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

export async function getUpdates(): Promise<Update[]> {
    const q = query(collection(db, 'updates'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Update));
}
