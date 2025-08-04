
import {
  signOut,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase'; 
import type { User, UserRole } from './types';


// This function is now handled in store.tsx to ensure auth is complete first.
// export const createNewUserProfile = async (user: import('firebase/auth').User, role: UserRole) => {
// };


// Logout user
export const logoutUser = async () => {
  return await signOut(auth);
};

// onAuthStateChanged is now called directly from firebase/auth in store.tsx
// to avoid circular dependencies and import issues.

    
