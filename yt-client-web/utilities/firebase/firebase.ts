// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User} from "firebase/auth";
import { getFunctions } from "firebase/functions";
import dotenv from 'dotenv';
dotenv.config();

// Your Firebase initialization code here
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const functions = getFunctions();
 

// Firebase Auth Functions

/**
 * Signs the user in with Google popup
 * @returns A promise that resolves with the user's credentials
 */

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

/**
 * Signs the user out
 * @returns A promise that resolves when the user is signed out
*/

export function signOut() {
  return auth.signOut();
}

/**
 * Trigger a callback when user auth changes
 * @returns A function to unsubscribe callback
 */

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback); 
}