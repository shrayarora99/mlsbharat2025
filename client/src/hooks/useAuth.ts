import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getIdToken } from "firebase/auth";

export function useAuth() {
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);

  const { data: user, isLoading: userLoading, error: userError, refetch } = useQuery({
    queryKey: ["/api/auth/user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) {
        throw new Error("Not authenticated");
      }
      
      try {
        // Get Firebase ID token and include in request
        const token = await getIdToken(firebaseUser);
        const response = await fetch("/api/auth/user", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch user:", response.status, errorText);
          throw new Error(`Failed to fetch user: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.error("Error in user fetch:", error);
        throw error;
      }
    },
    enabled: !!firebaseUser && !!firebaseUser.uid,
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for auth errors
      return failureCount < 2 && !error.message.includes("401");
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000, // Cache for 30 seconds
  });

  const isLoading = firebaseLoading || userLoading;
  const isAuthenticated = !!firebaseUser && !!user;
  const error = firebaseError || userError;

  // Log authentication state for debugging
  console.log('Auth state:', { 
    isLoading, 
    error: error?.message, 
    isAuthenticated,
    firebaseUser: firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null,
    user
  });

  const needsRoleSelection = isAuthenticated && user && (
    !user.role || 
    !user.phoneNumber || 
    (user.role === 'broker' && !user.reraId)
  );

  console.log('Router auth state:', {
    isAuthenticated,
    isLoading,
    user,
    error: error?.message || null,
  });

  console.log('Needs role selection:', needsRoleSelection);

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    error,
    refetch,
    needsRoleSelection,
  };
}
