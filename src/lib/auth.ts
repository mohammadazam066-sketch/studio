
import {
  signOut,
  onAuthStateChanged,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase'; 
import type { User, UserRole, HomeownerProfile, ShopOwnerProfile } from './types';


// This function is called when a user signs in for the first time.
export const createNewUserProfile = async (user: import('firebase/auth').User, role: UserRole) => {
  if (!user.phoneNumber) throw new Error("User phone number is not available.");

  try {
    // Create user document in 'users' collection
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      phoneNumber: user.phoneNumber,
      role: role,
      createdAt: serverTimestamp(),
    });

    // Create corresponding profile document
    const profileCollection = role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
    const profileDocRef = doc(db, profileCollection, user.uid);
    
    // Generic name based on phone number for starters
    const defaultName = `User ${user.phoneNumber.slice(-4)}`;

    if (role === 'shop-owner') {
      const profileData: Omit<ShopOwnerProfile, 'id'> = {
          name: defaultName,
          phoneNumber: user.phoneNumber,
          shopName: `${defaultName}'s Shop`,
          phoneNumber: user.phoneNumber,
          address: '',
          location: '',
          shopPhotos: [],
          createdAt: serverTimestamp(),
      };
      await setDoc(profileDocRef, profileData);
    } else {
      const profileData: Omit<HomeownerProfile, 'id'> = {
          name: defaultName,
          phoneNumber: user.phoneNumber,
          address: '',
          createdAt: serverTimestamp(),
      };
       await setDoc(profileDocRef, profileData);
    }

    return user;
  } catch (error) {
    // If creating the Firestore documents fails, delete the Firebase Auth user
    // to prevent inconsistent states.
    await deleteUser(user);
    // Rethrow the error to be caught by the UI
    throw error;
  }
};


// Logout user
export const logoutUser = async () => {
  return await signOut(auth);
};

// Auth state observer
export const onAuthChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user && user.phoneNumber) {
      // User is signed in, fetch their data from 'users' and their profile.
      const userDocRef = doc(db, 'users', user.uid);
      let userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // This is a rare case, but if the user exists in Auth but not Firestore,
        // we can't determine their role to create a profile.
        // For this app, we will log them out to force re-selection of role.
        console.warn(`User document not found for UID ${user.uid}. Logging out to re-initiate flow.`);
        await logoutUser();
        callback(null);
        return;
      }
      
      const userData = userDocSnap.data() as Omit<User, 'id' | 'profile'> & { id: string };

      // Determine profile collection based on role
      const profileCollection = userData.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
      const profileDocRef = doc(db, profileCollection, user.uid);
      let profileDocSnap = await getDoc(profileDocRef);
      
      const userProfile = profileDocSnap.exists() ? profileDocSnap.data() : null;

      callback({
        ...userData,
        profile: userProfile,
      });

    } else {
      // User is signed out.
      callback(null);
    }
  });
};
