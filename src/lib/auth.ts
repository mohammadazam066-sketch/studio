
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from './firebase'; // Ensure your firebase.ts exports the initialized app
import type { User, UserRole, HomeownerProfile, ShopOwnerProfile } from './types';

const auth = getAuth(app);
const db = getFirestore(app);

// Register user
export const registerUser = async (email: string, password: string, username: string, role: UserRole) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user document in 'users' collection
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    id: user.uid,
    username,
    email: user.email,
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
        name: username,
        email: user.email,
        createdAt: serverTimestamp(),
        shopName: `${username}'s Shop`,
        phoneNumber: '',
        address: '',
        location: '',
        shopPhotos: [],
    };
  } else {
    // Add homeowner-specific fields if any (optional)
     profileData = {
        username: username,
        name: username,
        email: user.email,
        createdAt: serverTimestamp(),
        phoneNumber: '',
        address: '',
    };
  }

  await setDoc(profileDocRef, profileData);

  return user;
};

// Login user
export const loginUser = async (email, password) => {
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
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as Omit<User, 'id'> & { id: string };

        // Determine profile collection based on role
        const profileCollection = userData.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
        const profileDocRef = doc(db, profileCollection, user.uid);
        let profileDocSnap = await getDoc(profileDocRef);

        // --- FIX FOR EXISTING USERS ---
        // If profile doesn't exist, create a default one.
        if (!profileDocSnap.exists()) {
          console.warn(`Profile not found for user ${user.uid}. Creating a default profile.`);
          const defaultProfileData: any = {
            id: user.uid,
            username: userData.username,
            name: userData.username,
            email: userData.email,
            createdAt: serverTimestamp(),
          };

          if (userData.role === 'shop-owner') {
            defaultProfileData.shopName = `${userData.username}'s Shop`;
            defaultProfileData.phoneNumber = '';
            defaultProfileData.address = '';
            defaultProfileData.location = '';
            defaultProfileData.shopPhotos = [];
          } else {
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
        // This case should ideally not happen if registration is done correctly.
        console.error("User document not found in Firestore for authenticated user.");
        callback(null);
      }
    } else {
      // User is signed out.
      callback(null);
    }
  });
};
