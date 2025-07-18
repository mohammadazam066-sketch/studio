# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export async function registerUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    id: user.uid,
    email: user.email,
    role: "homeowner", // or "shopOwner"
    createdAt: serverTimestamp(),
  });

  console.log("User registered with UID:", user.uid);
}
