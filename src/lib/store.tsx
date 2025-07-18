
'use client';

import type { Requirement, Quotation, Update } from './types';
import { db, storage } from './firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, writeBatch, orderBy, deleteDoc, type QueryConstraint } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";

// --- DATA FUNCTIONS ---

// NOTE: All functions that relied on auth.currentUser have been modified.
// A dummy userId is used where necessary to maintain data structure.
const DUMMY_USER_ID = 'public_user';

export async function getUser(userId: string) {
    // This function is now a stub as users are anonymous
    return undefined;
};
    
export async function updateUser(userId: string, updatedDetails: any) {
    // This function is now a stub as users are anonymous
    console.log("updateUser is a stub and does not write to the database anymore.");
    return Promise.resolve();
}

export async function addRequirement(requirementData: Omit<Requirement, 'id' | 'createdAt' | 'homeownerId' | 'status'>) {
    const photoDataUrls = requirementData.photos;
    const uploadedPhotoUrls = await Promise.all(
        (photoDataUrls || []).map(async (dataUrl, index) => {
            const storageRef = ref(storage, `requirements/${DUMMY_USER_ID}/${Date.now()}-photo-${index}.jpg`);
            await uploadString(storageRef, dataUrl, 'data_url', { contentType: 'image/jpeg' });
            return getDownloadURL(storageRef);
        })
    );

    const fullRequirementData: Omit<Requirement, 'id'> = {
        ...requirementData,
        homeownerId: DUMMY_USER_ID,
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
        const storageRef = ref(storage, `requirements/${DUMMY_USER_ID}/${requirementId}-${Date.now()}-${index}.jpg`);
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


export async function addQuotation(newQuotation: Omit<Quotation, 'id' | 'createdAt' | 'shopOwnerId'>) {
    const quotationToAdd = {
        ...newQuotation,
        shopOwnerId: DUMMY_USER_ID,
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
    const q = query(collection(db, 'quotations'), where('shopOwnerId', '==', shopOwnerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
}


export async function getProfile(userId: string) {
    // This function is now a stub as users are anonymous
    return undefined;
};

export async function updateProfile(updatedProfileData: any, newPhotosState: any) {
    // This function is now a stub as users are anonymous
    console.log("updateProfile is a stub and does not write to the database anymore.");
    return Promise.resolve();
};


// --- UPDATES FEED FUNCTIONS ---

export async function addUpdate(newUpdate: Omit<Update, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorRole'> & { imageUrl?: string; authorName: string, authorRole: 'homeowner' | 'shop-owner' }) {
    let finalImageUrl = newUpdate.imageUrl;
    if (newUpdate.imageUrl) {
        const storageRef = ref(storage, `updates/${DUMMY_USER_ID}/${Date.now()}.jpg`);
        await uploadString(storageRef, newUpdate.imageUrl, 'data_url', { contentType: 'image/jpeg' });
        finalImageUrl = await getDownloadURL(storageRef);
    }

    const updateToAdd = {
      title: newUpdate.title,
      content: newUpdate.content,
      imageUrl: finalImageUrl || '',
      authorId: DUMMY_USER_ID,
      authorName: newUpdate.authorName,
      authorRole: newUpdate.authorRole,
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

  if (newImage && newImage.dataUrl) {
    if (newImage.oldImageUrl) {
        try {
            const oldImageRef = ref(storage, newImage.oldImageUrl);
            await deleteObject(oldImageRef);
        } catch (error) {
            console.error("Failed to delete old image, continuing update.", error);
        }
    }
    const newImageRef = ref(storage, `updates/${DUMMY_USER_ID}/${Date.now()}.jpg`);
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
