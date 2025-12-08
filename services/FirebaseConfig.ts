// Firebase Configuration
// Your actual Firebase project configuration
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBEa9B11COaqlpNQfS61YzzMGnW6CwOic",
  authDomain: "foodapp-b20e9.firebaseapp.com",
  projectId: "foodapp-b20e9",
  storageBucket: "foodapp-b20e9.firebasestorage.app",
  messagingSenderId: "49599682475",
  appId: "1:49599682475:web:da8a469d277465858f64ee",
  measurementId: "G-ZL82XT9F0M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Export auth functions for OTP
export { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
};

// For development/testing, you can use these demo values:
// Note: Replace with your actual Firebase config before production
export const DEMO_FIREBASE_CONFIG = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

export default app;

