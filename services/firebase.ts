

// @ts-ignore - Suppress misleading named export error for Firebase App functions
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - Suppress misleading named export error for Firebase Auth
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
// @ts-ignore
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';
// @ts-ignore - Suppress misleading named export error for Firebase Analytics
import { getAnalytics, isSupported } from 'firebase/analytics';
// Removed: import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const firebaseConfig = {
  // NOTE: This apiKey is for Firebase services (Authentication, Firestore), NOT for Google Gemini API.
  // The Gemini API key needs to be provided via `process.env.API_KEY` for AI features.
  apiKey: "AIzaSyBVmSAxOR4nZxvzMZZS1uH4II_sdoJSQ1g",
  authDomain: "bishal-mishra-3c559.firebaseapp.com",
  projectId: "bishal-mishra-3c559",
  storageBucket: "bishal-mishra-3c559.firebasestorage.app", // Keep for config, but not actively used
  messagingSenderId: "459193835216",
  appId: "1:459193835216:web:32de44a9f2d52ed80b88d5",
  measurementId: "G-V89CSR1TXR"
};

// Initialize Firebase using modular imports
// @ts-ignore - Suppress misleading named export error for Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// @ts-ignore
export const auth = getAuth(app);

// Silence Firestore connection warning/info logs in the browser to avoid Next.js overlay triggers
if (typeof window !== 'undefined') {
  setLogLevel('error');
}

// Enable offline persistence only in browser environments
export const db = typeof window !== 'undefined'
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  : getFirestore(app);
// Removed: export const storage = getStorage(app); // Removed Firebase Storage export
// @ts-ignore
export const googleProvider = new GoogleAuthProvider();
// @ts-ignore
export const githubProvider = new GithubAuthProvider();

// Removed global Gemini instance to ensure it's instantiated fresh before use as per guidelines

// Analytics initialization using modular functions
if (typeof window !== 'undefined') {
  // @ts-ignore
  isSupported().then(yes => yes && getAnalytics(app));
}