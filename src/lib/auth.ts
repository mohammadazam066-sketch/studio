
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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

// Dummy domain for creating emails from usernames
const DUMMY_EMAIL_DOMAIN = 'tradeflow.app';

// Register user with username and password
export const registerUser = async (username: string, password: string, role: UserRole) => {
  // Create a dummy email for Firebase Auth
  const email = `${username.toLowerCase()}@${DUMMY_EMAIL_DOMAIN}`;
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  try {
    // Create user document in 'users' collection
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      username,
      email: '', // Store an empty string for email, as it's not provided by user
      role: role,
      createdAt: serverTimestamp(),
    });

    // Create corresponding profile document
    const profileCollection = role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
    const profileDocRef = doc(db, profileCollection, user.uid);
    
    let profileData: Omit<HomeownerProfile, 'id'> | Omit<ShopOwnerProfile, 'id'>;

    if (role === 'shop-owner') {
      // Add shop-owner specific fields with default empty values
      profileData = {
          username: username,
          name: username, // Default name to username
          email: '',
          createdAt: serverTimestamp(),
          shopName: `${username}'s Shop`, // Default shop name
          phoneNumber: '',
          address: '',
          location: '',
          shopPhotos: [],
      };
    } else {
      // Add homeowner-specific fields if any
      profileData = {
          username: username,
          name: username, // Default name to username
          email: '',
          createdAt: serverTimestamp(),
          phoneNumber: '',
          address: '',
      };
    }

    await setDoc(profileDocRef, profileData);

    return user;
  } catch (error) {
    // If creating the Firestore documents fails, delete the Firebase Auth user
    // to prevent inconsistent states.
    if (user) {
      await deleteUser(user);
    }
    // Rethrow the error to be caught by the UI
    throw error;
  }
};

// Login user with username and password
export const loginUser = async (username: string, password: string) => {
  // Create the dummy email to check against Firebase Auth
  const email = `${username.toLowerCase()}@${DUMMY_EMAIL_DOMAIN}`;
  return await signInWithEmailAndPassword(auth, email, password);
};

// Logout user
export const logoutUser = async () => {
  return await signOut(auth);
};

// Auth state observer
export const onAuthChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, fetch their data from 'users' and their profile.
      const userDocRef = doc(db, 'users', user.uid);
      let userDocSnap = await getDoc(userDocRef);

      // FIX: If the user document doesn't exist, we can't determine their role.
      // This is an inconsistent state. We should log them out.
      if (!userDocSnap.exists()) {
        console.error("Critical: User is authenticated but has no user document. Logging out.");
        await logoutUser();
        callback(null);
        return;
      }
      
      const userData = userDocSnap.data() as Omit<User, 'id'> & { id: string };

      // Determine profile collection based on role
      const profileCollection = userData.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
      const profileDocRef = doc(db, profileCollection, user.uid);
      let profileDocSnap = await getDoc(profileDocRef);

      // --- DEFENSIVE PROFILE CREATION ---
      // If profile doesn't exist for a valid user, create a default one.
      if (!profileDocSnap.exists()) {
        console.warn(`Profile not found for user ${user.uid}. Creating a default profile.`);
        const defaultProfileData: any = {
          username: userData.username,
          name: userData.username,
          email: '',
          createdAt: serverTimestamp(),
        };

        if (userData.role === 'shop-owner') {
          defaultProfileData.shopName = `${userData.username}'s Shop`;
          defaultProfileData.phoneNumber = '';
          defaultProfileData.address = '';
          defaultProfileData.location = '';
          defaultProfileData.shopPhotos = [];
        } else { // homeowner
          defaultProfileData.phoneNumber = '';
          defaultProfileData.address = '';
        }
        await setDoc(profileDocRef, defaultProfileData);
        // Re-fetch the profile snapshot after creating it
        profileDocSnap = await getDoc(profileDocRef);
      }
      
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
