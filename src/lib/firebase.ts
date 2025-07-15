
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrm6-aomerOz7DZlgSwmPFlU_FrhQj1m4",
  authDomain: "tradeflow-tiu5k.firebaseapp.com",
  projectId: "tradeflow-tiu5k",
  storageBucket: "tradeflow-tiu5k.firebasestorage.app",
  messagingSenderId: "28930351057",
  appId: "1:28930351057:web:c67a6859f2ffdfd5da0af0"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set auth persistence
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Firebase Auth persistence error:", error.code, error.message);
  });

// Enable offline persistence for Firestore
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
        await enableIndexedDbPersistence(db);
    } catch (error: any) {
        if (error.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (error.code === 'unimplemented') {
            console.warn('Firestore persistence failed: The current browser does not support all of the features required to enable persistence.');
        }
    }
  }
});


export { app, auth, db, storage };
