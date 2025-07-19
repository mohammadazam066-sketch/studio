
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
  const lowercaseUsername = username.toLowerCase();
  // Create a dummy email for Firebase Auth using lowercase username
  const email = `${lowercaseUsername}@${DUMMY_EMAIL_DOMAIN}`;
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  try {
    // Create user document in 'users' collection with the original cased username for display
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      username: lowercaseUsername,
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
          username: lowercaseUsername,
          name: username, // Default name to username
          email: '',
          shopName: `${username}'s Shop`, // Default shop name
          phoneNumber: '',
          address: '',
          location: '',
          shopPhotos: [],
          createdAt: serverTimestamp(),
      };
    } else {
      // Add homeowner-specific fields if any
      profileData = {
          username: lowercaseUsername,
          name: username, // Default name to username
          email: '',
          phoneNumber: '',
          address: '',
          createdAt: serverTimestamp(),
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

      // --- SELF-HEALING LOGIC ---
      // If the user document doesn't exist, create it and a default profile.
      if (!userDocSnap.exists()) {
        console.warn(`User document not found for user ${user.uid}. Re-creating document and default profile.`);
        const defaultRole: UserRole = 'homeowner';
        const username = user.email?.split('@')[0] || 'recovered_user';

        // 1. Create the user document
        await setDoc(userDocRef, {
            id: user.uid,
            username: username,
            email: '',
            role: defaultRole,
            createdAt: serverTimestamp(),
        });

        // 2. Create the default homeowner profile
        const profileDocRef = doc(db, 'homeownerProfiles', user.uid);
        await setDoc(profileDocRef, {
            username: username,
            name: username,
            email: '',
            createdAt: serverTimestamp(),
            phoneNumber: '',
            address: '',
        });
        
        // 3. Re-fetch the user document snapshot
        userDocSnap = await getDoc(userDocRef);
      }
      
      const userData = userDocSnap.data() as Omit<User, 'id'> & { id: string };

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
