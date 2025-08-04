
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
import type { User, UserRole } from './types';


// This function is now handled in store.tsx to ensure auth is complete first.
// export const createNewUserProfile = async (user: import('firebase/auth').User, role: UserRole) => {
// };


// Logout user
export const logoutUser = async () => {
  return await signOut(auth);
};

// Auth state observer (This is now the main one used in AuthProvider)
// The onAuthChanged in the original auth.ts can be considered a backup or for non-React parts if any.
export { onAuthStateChanged };

    