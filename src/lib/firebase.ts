
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
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

// Initialize Firestore with caching enabled.
// This is the modern and more reliable way to enable offline persistence.
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

const storage = getStorage(app);

export { app, db, storage };
