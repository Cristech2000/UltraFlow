import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { getDatabase, ref, set, get, update, child, onValue } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  // ✅ FIX: Use the correct region URL from the error message
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.europe-west1.firebasedatabase.app`,
};

console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL,
});

// Validate environment variables
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

for (const varName of requiredVars) {
  if (!import.meta.env[varName]) {
    console.warn(`Missing environment variable: ${varName}`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Auth persistence error:', error);
});

export default app;