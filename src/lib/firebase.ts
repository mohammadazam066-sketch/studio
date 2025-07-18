
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence,
  Firestore
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrm6-aomerOz7DZlgSwmPFlU_FrhQj1m4",
  authDomain: "tradeflow-tiu5k.firebaseapp.com",
  projectId: "tradeflow-tiu5k",
  storageBucket: "tradeflow-tiu5k.appspot.com",
  messagingSenderId: "28930351057",
  appId: "1:28930351057:web:6200a731ed264791da0af0"
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
