
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrm6-aomerOz7DZlgSwmPFlU_FrhQj1m4",
  authDomain: "tradelinkk.firebaseapp.com",
  projectId: "tradelinkk",
  storageBucket: "tradelinkk.appspot.com",
  messagingSenderId: "28930351057",
  appId: "1:28930351057:web:c67a6859f2ffdfd5da0af0"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence for Firestore
try {
    enableIndexedDbPersistence(db);
} catch (error: any) {
    if (error.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (error.code === 'unimplemented') {
        console.warn('Firestore persistence failed: The current browser does not support all of the features required to enable persistence.');
    }
}

export { app, db, storage };
