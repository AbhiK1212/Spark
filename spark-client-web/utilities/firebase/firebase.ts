"use client";

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User} from "firebase/auth";
import { getFunctions } from "firebase/functions";


const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
} as const;

const isFirebaseConfigured = () => {
  const hasApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-key";
  const hasAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN !== "demo-project.firebaseapp.com";
  const hasProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "demo-project";
  const hasAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID && process.env.NEXT_PUBLIC_FIREBASE_APP_ID !== "demo-app-id";
  
  console.log('🔧 Firebase config check:', {
    hasApiKey,
    hasAuthDomain, 
    hasProjectId,
    hasAppId,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 10) + '...'
  });
  
  return hasApiKey && hasAuthDomain && hasProjectId && hasAppId;
};

let app: any = null;
let auth: any = null;
let functions: any = null;

try {
  if (typeof window !== 'undefined' && isFirebaseConfigured()) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    functions = getFunctions(app);
  } else {
    console.warn('Firebase not configured. Please set up your environment variables.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, functions };

export function signInWithGoogle() {
  if (!auth) {
    throw new Error('Firebase not configured. Please set up your environment variables.');
  }
  return signInWithPopup(auth, new GoogleAuthProvider());
}


export function signOut() {
  if (!auth) {
    throw new Error('Firebase not configured. Please set up your environment variables.');
  }
  return auth.signOut();
}


export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!auth) {
    console.warn('Firebase not configured. Auth state changes will not work.');
    return () => {};
  }
  return onAuthStateChanged(auth, callback); 
}