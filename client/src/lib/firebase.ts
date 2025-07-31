// client/src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    (import.meta.env.VITE_FIREBASE_PROJECT_ID
      ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
      : undefined),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    (import.meta.env.VITE_FIREBASE_PROJECT_ID
      ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`
      : undefined),
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function hasConfig(): boolean {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function ensureInit() {
  if (!hasConfig()) return;
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  }
  if (!auth) {
    auth = getAuth(app);
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  ensureInit();
  return app;
}

export function getFirebaseAuth(): Auth | null {
  ensureInit();
  return auth;
}

// Analytics only when supported
let analytics: any = null;
;(async () => {
  if (hasConfig() && (await isSupported().catch(() => false))) {
    const a = getFirebaseApp();
    if (a) analytics = getAnalytics(a);
  }
})();
export { analytics };

// --- Providers ---
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

// --- Auth Helpers ---
export const signInWithGoogle = (usePopup = false) =>
  usePopup
    ? signInWithPopup(requireAuth(), googleProvider)
    : signInWithRedirect(requireAuth(), googleProvider);

export const handleGoogleRedirect = () => getRedirectResult(requireAuth());

export const signUpWithEmail = (
  email: string,
  password: string,
  displayName?: string
) =>
  createUserWithEmailAndPassword(requireAuth(), email, password).then((res) => {
    if (displayName) {
      return updateProfile(res.user, { displayName }).then(() => res);
    }
    return res;
  });

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(requireAuth(), email, password);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(requireAuth(), email);

export const signInWithApple = (usePopup = true) =>
  usePopup
    ? signInWithPopup(requireAuth(), appleProvider)
    : signInWithRedirect(requireAuth(), appleProvider);
