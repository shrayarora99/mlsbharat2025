import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const handleLogout = async (): Promise<void> => {
  try {
    await signOut(auth);
    window.location.href = "/";
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = "/";
  }
};

export const redirectToHome = (): void => {
  window.location.href = "/";
};