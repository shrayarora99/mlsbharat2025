import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithRedirect, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getRedirectResult,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Debug environment variables
console.log('Firebase Config Debug:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Missing',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? 'Set' : 'Missing'
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('Final Firebase Config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize analytics only if supported
let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Auth Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Export authentication functions
export const signInWithGoogle = async (usePopup = false) => {
  try {
    console.log('🚀 Starting Google sign-in...');
    console.log('📍 Current domain:', window.location.hostname);
    console.log('🔧 Method:', usePopup ? 'popup' : 'redirect');
    
    if (usePopup) {
      console.log('📱 Using popup sign-in method...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Popup sign-in successful:', result.user.uid);
      return result;
    } else {
      console.log('🔄 Using redirect sign-in method...');
      await signInWithRedirect(auth, googleProvider);
    }
  } catch (error: any) {
    console.error('❌ Error during Google sign-in:', error);
    console.error('🔍 Error code:', error.code);
    console.error('📝 Error message:', error.message);
    throw error;
  }
};

export const handleGoogleRedirect = async () => {
  try {
    console.log('Checking for Google sign-in redirect result...');
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('Google sign-in successful:', result.user.uid);
      return result;
    }
    console.log('No redirect result found');
    return null;
  } catch (error: any) {
    console.error('Error handling Google redirect:', error);
    throw new Error(`Redirect handling failed: ${error.message}`);
  }
};

// Email/Password Authentication
export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  try {
    console.log('🚀 Starting email sign-up...');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    
    console.log('✅ Email sign-up successful:', result.user.uid);
    return result;
  } catch (error: any) {
    console.error('❌ Error during email sign-up:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('🚀 Starting email sign-in...');
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Email sign-in successful:', result.user.uid);
    return result;
  } catch (error: any) {
    console.error('❌ Error during email sign-in:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    console.log('🚀 Sending password reset email...');
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent');
  } catch (error: any) {
    console.error('❌ Error sending password reset:', error);
    throw error;
  }
};

// Apple Authentication
export const signInWithApple = async (usePopup = true) => {
  try {
    console.log('🚀 Starting Apple sign-in...');
    console.log('🔧 Method:', usePopup ? 'popup' : 'redirect');
    
    if (usePopup) {
      console.log('📱 Using popup sign-in method...');
      const result = await signInWithPopup(auth, appleProvider);
      console.log('✅ Apple popup sign-in successful:', result.user.uid);
      return result;
    } else {
      console.log('🔄 Using redirect sign-in method...');
      await signInWithRedirect(auth, appleProvider);
    }
  } catch (error: any) {
    console.error('❌ Error during Apple sign-in:', error);
    console.error('🔍 Error code:', error.code);
    console.error('📝 Error message:', error.message);
    throw error;
  }
};

export { analytics };