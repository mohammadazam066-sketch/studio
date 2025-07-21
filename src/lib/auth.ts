
import {
  signOut,
  onAuthStateChanged,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase'; 
import type { User } from './types';


// This function is now handled in store.tsx to ensure auth is complete first.
// export const createNewUserProfile = async (user: import('firebase/auth').User, role: UserRole) => {
// };


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
        // This can happen for a brand new user who just finished OTP, but hasn't selected a role yet.
        // The UI will handle role selection, and then create the document.
        // For our state, we'll return a minimal user object.
        callback({
          id: user.uid,
          phoneNumber: user.phoneNumber,
          // Role and profile will be missing until they complete registration.
        } as User);
        return;
      }
      
      const userData = userDocSnap.data() as Omit<User, 'id' | 'profile'> & { id: string };

      // Determine profile collection based on role
      const profileCollection = userData.role === 'homeowner' ? 'homeownerProfiles' : 'shopOwnerProfiles';
      const profileDocRef = doc(db, profileCollection, user.uid);
      let profileDocSnap = await getDoc(profileDocRef);
      
      const userProfile = profileDocSnap.exists() ? { id: profileDocSnap.id, ...profileDocSnap.data() } : undefined;

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
