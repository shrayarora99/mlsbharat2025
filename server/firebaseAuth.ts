import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { RequestHandler } from 'express';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // For development, we'll use the Firebase project directly
    // In production, you should use service account credentials
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'mlsbharat-7be4b',
    });
  }
  return getApp();
}

// Initialize Firebase Admin
const app = initializeFirebaseAdmin();
const auth = getAuth(app);

// Middleware to verify Firebase JWT tokens
export const verifyFirebaseToken: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No valid authorization header found' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Add user info to request object
    (req as any).firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    console.error('Token verification failed for token:', idToken?.substring(0, 20) + '...');
    console.error('Error details:', (error as Error).message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Optional middleware for routes that can work with or without authentication
export const optionalFirebaseAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return next(); // Continue without authentication
    }

    // Try to verify the token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Add user info to request object if token is valid
    (req as any).firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified,
    };
  } catch (error) {
    console.log('Optional auth failed, continuing without authentication:', (error as Error).message);
  }
  
  next();
};

export { auth as firebaseAuth };