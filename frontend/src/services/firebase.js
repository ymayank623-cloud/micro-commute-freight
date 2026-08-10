import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// These values are placeholders except for apiKey.
// Real Firebase Phone Auth requires the full correct config object from Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyAWiCmb9FwZKcCUA7OXszUyInCVx9tS-Rc",
  authDomain: "flowlink-1b067.firebaseapp.com",
  projectId: "flowlink-1b067",
  storageBucket: "flowlink-1b067.firebasestorage.app",
  messagingSenderId: "100030151253",
  appId: "1:100030151253:web:a357aa64589307c58d32dc",
  measurementId: "G-MYTLPNP9W2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
