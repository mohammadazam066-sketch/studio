
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence,
  Firestore
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let persistenceEnabled = false;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
storage = getStorage(app);
db = getFirestore(app);

// Self-invoking function to enable persistence as soon as this module is loaded on the client.
(async () => {
    if (typeof window !== 'undefined' && !persistenceEnabled) {
        try {
            await enableMultiTabIndexedDbPersistence(db);
            persistenceEnabled = true;
            console.log("Firestore persistence enabled.");
        } catch (err: any) {
            if (err.code === 'failed-precondition') {
                // This is okay, means another tab has it open
                persistenceEnabled = true;
            } else if (err.code === 'unimplemented') {
                // Browser doesn't support persistence
            } else {
                console.error("Error enabling Firestore persistence:", err);
            }
        }
    }
})();

export { app, auth, db, storage };
