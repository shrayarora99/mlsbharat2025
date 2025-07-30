// before:
// import { auth } from '@/lib/firebase';

// after:
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

useEffect(() => {
  const auth = getFirebaseAuth();
  if (!auth) {
    // No Firebase on this deployment — treat as logged out
    setUser(null);
    setIsLoading(false);
    return;
  }

  const unsub = onAuthStateChanged(auth, (u) => {
    setUser(u);
    setIsLoading(false);
  });
  return () => unsub();
}, []);
