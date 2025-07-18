
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  enableMultiTabIndexedDbPersistence,
  Firestore
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrm6-aomerOz7DZlgSwmPFlU_FrhQj1m4",
  authDomain: "tradelinkk.firebaseapp.com",
  projectId: "tradelinkk",
  storageBucket: "tradelinkk.appspot.com",
  messagingSenderId: "28930351057",
  appId: "1:28930351057:web:c67a6859f2ffdfd5da0af0"
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
db = getFirestore(app);
storage = getStorage(app);


// This function can be called from a client-side component's useEffect hook
// to ensure it only runs in the browser.
export const enablePersistence = async () => {
    if (typeof window !== 'undefined' && !persistenceEnabled) {
        try {
            await enableMultiTabIndexedDbPersistence(db);
            persistenceEnabled = true;
        } catch (err: any) {
            if (err.code === 'failed-precondition') {
                // This is okay, means another tab has it open
            } else if (err.code === 'unimplemented') {
                // Browser doesn't support persistence
            }
        }
    }
}

export { app, auth, db, storage };
