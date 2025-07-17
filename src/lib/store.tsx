

'use client';

import { useState, useEffect, createContext, useContext, Dispatch, SetStateAction } from 'react';
import type { Requirement, Quotation, ShopOwnerProfile, User, Update } from './types';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, writeBatch, orderBy, deleteDoc } from 'firebase/firestore';
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


export async function addRequirement(newRequirement: Omit<Requirement, 'id' | 'createdAt' | 'photos' | 'status'>) {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const userData = userDoc.data();
    if (!userData) throw new Error("User data not found in Firestore");

    const requirementToAdd: Omit<Requirement, 'id' | 'createdAt'> = {
        ...newRequirement,
        homeownerId: auth.currentUser.uid,
        homeownerName: userData.username || 'Anonymous',
        status: 'Open',
        photos: [], // Will be populated after upload
    };

    const docRef = await addDoc(collection(db, 'requirements'), {
        ...requirementToAdd,
        createdAt: serverTimestamp(),
    });

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

    // 1. Determine which new photos need uploading and which existing URLs are kept
    const photoUrlsToUpload = newPhotosState.filter(p => typeof p !== 'string') as { file: File, preview: string }[];
    const existingUrlsToKeep = newPhotosState.filter(p => typeof p === 'string') as string[];

    // 2. Upload new photos and get their download URLs
    const newUploadedUrls = await Promise.all(
        photoUrlsToUpload.map(async (photoState, index) => {
            const storageRef = ref(storage, `requirements/${auth.currentUser!.uid}/${Date.now()}-updated-${index}.jpg`);
            await uploadString(storageRef, photoState.preview, 'data_url', { contentType: 'image/jpeg' });
            return getDownloadURL(storageRef);
        })
    );

    const finalPhotoUrls = [...existingUrlsToKeep, ...newUploadedUrls];

    // 3. Determine which of the original photos were removed
    const removedUrls = originalPhotoUrls.filter(url => !finalPhotoUrls.includes(url));

    // 4. Delete removed photos from storage
    await Promise.all(
        removedUrls.map(async (url) => {
            try {
                const photoRef = ref(storage, url);
                await deleteObject(photoRef);
            } catch (error) {
                console.error("Failed to delete old photo:", url, error);
            }
        })
    );
    
    // 5. Prepare the data and update the Firestore document
    const dataToUpdate = {
        ...updateData,
        photos: finalPhotoUrls,
    };

    await updateDoc(requirementRef, dataToUpdate);
}

export async function deleteRequirement(requirementId: string) {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const batch = writeBatch(db);
    const requirementRef = doc(db, 'requirements', requirementId);
    
    // 1. Get the requirement to find associated photos and quotations
    const reqDoc = await getDoc(requirementRef);
    if (!reqDoc.exists()) throw new Error("Requirement not found");
    
    const requirement = reqDoc.data() as Requirement;
    
    // Ensure the user deleting is the owner
    if (requirement.homeownerId !== auth.currentUser.uid) {
        throw new Error("User does not have permission to delete this requirement.");
    }

    // 2. Delete photos from storage
    if (requirement.photos && requirement.photos.length > 0) {
        const photoDeletionPromises = requirement.photos.map(url => {
            try {
                return deleteObject(ref(storage, url));
            } catch (error) {
                console.error("Failed to delete requirement photo:", url, error);
                return Promise.resolve(); // Don't block if one photo fails
            }
        });
        await Promise.all(photoDeletionPromises);
    }
    
    // 3. Find and delete all associated quotations
    const quotationsQuery = query(collection(db, 'quotations'), where('requirementId', '==', requirementId));
    const quotationsSnapshot = await getDocs(quotationsQuery);
    quotationsSnapshot.forEach(quoteDoc => {
        batch.delete(quoteDoc.ref);
    });

    // 4. Delete the requirement document itself
    batch.delete(requirementRef);

    // 5. Commit the batch
    await batch.commit();
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
    let q = query(collection(db, 'requirements'), orderBy('createdAt', 'desc'));

    const constraints = [];
    if (filters.homeownerId) {
        constraints.push(where('homeownerId', '==', filters.homeownerId));
    }
    if (filters.status) {
        constraints.push(where('status', '==', filters.status));
    }

    q = query(q, ...constraints);

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
    if (!auth.currentUser) throw new Error("Not authenticated");
    
    // This query is safe because the security rules check if the user is the homeowner or shop owner
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

export async function updateUpdate(
  updateId: string, 
  updateData: { title: string; content: string }, 
  newImage?: { dataUrl: string; oldImageUrl?: string }
) {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  const updateRef = doc(db, 'updates', updateId);
  const dataToUpdate: any = { ...updateData };

  // Case 1: A new image is provided
  if (newImage && newImage.dataUrl) {
    // Delete the old image if it exists
    if (newImage.oldImageUrl) {
        try {
            const oldImageRef = ref(storage, newImage.oldImageUrl);
            await deleteObject(oldImageRef);
        } catch (error) {
            console.error("Failed to delete old image, continuing update.", error);
        }
    }
    // Upload the new image
    const newImageRef = ref(storage, `updates/${auth.currentUser.uid}/${Date.now()}.jpg`);
    await uploadString(newImageRef, newImage.dataUrl, 'data_url', { contentType: 'image/jpeg' });
    dataToUpdate.imageUrl = await getDownloadURL(newImageRef);
  }
  // Case 2: The image was removed (dataUrl is empty string)
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
    
    // Delete the image from storage if it exists
    if (imageUrl) {
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (error) {
            // Log error but don't block firestore deletion if storage deletion fails
            console.error("Failed to delete update image from storage:", error);
        }
    }
    
    // Delete the document from Firestore
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

    

    