// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUILX10lUG2O8ePWwS2n-DHOkR09mQVb0",
  authDomain: "online-mba-4b0b6.firebaseapp.com",
  projectId: "online-mba-4b0b6",
  storageBucket: "online-mba-4b0b6.firebasestorage.app",
  messagingSenderId: "857302925828",
  appId: "1:857302925828:web:0acf3b22507d273d45ab51",
  measurementId: "G-CDVGNNF4BE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure Google Auth Provider - Remove domain restriction to allow both domains
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
  // Remove hd restriction since you need both @scaler.com and @ssb.scaler.com
});

export default app;