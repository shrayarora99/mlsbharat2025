// client/src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  signInWithRedirect,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getRedirectResult,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Read Vite envs (may be undefined in production)
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    ?? (import.meta.env.VITE_FIREBASE_PROJECT_ID
        ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
        : undefined),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    ?? (import.meta.env.VITE_FIREBASE_PROJECT_ID
        ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`
        : undefined),
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function hasConfig() {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Initialize only if config is present
function ensureInit() {
  if (!hasConfig()) return;
  if (!app) app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  if (!auth) auth = getAuth(app);
}

export function getFirebaseApp(): FirebaseApp | null {
  ensureInit();
  return app;
}

export function getFirebaseAuth(): Auth | null {
  ensureInit();
  return auth;
}

// Analytics only when supported and configured
let analytics: any = null;
(async () => {
  if (hasConfig() && (await isSupported().catch(() => false))) {
    const a = getFirebaseApp();
    if (a) analytics = getAnalytics(a);
  }
})();
export { analytics };

// --- Auth Providers (safe even if not configured) ---
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

function requireAuth(): Auth {
  const a = getFirebaseAuth();
  if (!a) throw new Error('Firebase is not configured on this deployment.');
  return a;
}

// --- Helper functions (no-ops if not configured) ---
export const signInWithGoogle = async (usePopup = false) => {
  const a = requireAuth();
  return usePopup
    ? await signInWithPopup(a, googleProvider)
    : await signInWithRedirect(a, googleProvider);
};

export const handleGoogleRedirect = async () => {
  const a = requireAuth();
  return await getRedirectResult(a);
};

export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  const a = requireAuth();
  const result = await createUserWithEmailAndPassword(a, email, password);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  return result;
};

export const signInWithEmail = async (email: string, password: string) => {
  const a = requireAuth();
  return await signInWithEmailAndPassword(a, email, password);
};

export const resetPassword = async (email: string) => {
  const a = requireAuth();
  await sendPasswordResetEmail(a, email);
};

export const signInWithApple = async (usePopup = true) => {
  const a = requireAuth();
  return usePopup
    ? await signInWithPopup(a, appleProvider)
    : await signInWithRedirect(a, appleProvider);
};
