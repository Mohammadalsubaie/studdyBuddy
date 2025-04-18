// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKBeTbo0NpMgVZP_6nIHyE-cMmJjrGVM0",
  authDomain: "studdy-buddy-aa5c2.firebaseapp.com",
  projectId: "studdy-buddy-aa5c2",
  storageBucket: "studdy-buddy-aa5c2.firebasestorage.app",
  messagingSenderId: "366614626042",
  appId: "1:366614626042:web:2fa2cb7cc069fda44c1343"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = getFirestore(app);

export { auth, db };