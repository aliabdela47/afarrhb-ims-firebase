// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your *real* Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4jBNY6uXnKcfRf_vYbA5hSevmf9Tn9a0", // Your real API Key
  authDomain: "afarrhb-edc7e.firebaseapp.com",         // Your real Auth Domain
  projectId: "afarrhb-edc7e",                          // Your real Project ID
  storageBucket: "afarrhb-edc7e.firebasestorage.app",  // Your real Storage Bucket
  messagingSenderId: "5723120619",                     // Your real Sender ID
  appId: "1:5723120619:web:d9188102e0d3ce0022afae"    // Your real App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
