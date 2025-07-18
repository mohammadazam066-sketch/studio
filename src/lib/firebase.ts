
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  enableMultiTabIndexedDbPersistence,
  type Firestore
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBrm6-aomerOz7DZlgSwmPFlU_FrhQj1m4",
  authDomain: "tradelinkk.firebaseapp.com",
  projectId: "tradelinkk",
  storageBucket: "tradelinkk.appspot.com",
  messagingSenderId: "28930351057",
  appId: "1:28930351057:web:c67a6859f2ffdfd5da0af0"
};

// Helper function to initialize Firebase App and services
const getFirebaseServices = () => {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const storage = getStorage(app);
  const db = getFirestore(app);

  // Enable multi-tab persistence
  if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open, this is a normal occurrence.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence failed: The current browser does not support all of the features required to enable persistence.');
      } else {
        console.error("Firestore persistence error:", err);
      }
    });
  }

  return { app, db, storage };
};

const { app, db, storage } = getFirebaseServices();

export { app, db, storage };
