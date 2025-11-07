import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDPUwV4smJnn2agPvE1RN1y1l9fJEfb1J8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tasksync-0711.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tasksync-0711",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tasksync-0711.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "930974381335",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:930974381335:web:c6176df6e343132dc37352",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9HW50TSF1Y"
};


console.log('Firebase Config Check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  projectId: firebaseConfig.projectId,
  usingEnvVars: !!import.meta.env.VITE_FIREBASE_API_KEY
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
