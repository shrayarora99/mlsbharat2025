import { useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { 
  auth, 
  signInWithGoogle, 
  signInWithApple,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  handleGoogleRedirect 
} from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  LogIn, 
  LogOut, 
  Mail, 
  Eye, 
  EyeOff, 
  UserPlus,
  RotateCcw
} from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

interface FirebaseAuthProps {
  onAuthChange?: (user: User | null) => void;
  showAsButtons?: boolean;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export function FirebaseAuth({ onAuthChange, showAsButtons = false }: FirebaseAuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Handle redirect result on component mount
    const handleRedirect = async () => {
      try {
        const result = await handleGoogleRedirect();
        if (result) {
          console.log('Successful Google sign-in:', result.user.uid);
          toast({
            title: "Welcome!",
            description: `Signed in as ${result.user.displayName || result.user.email}`,
          });
        }
      } catch (error: any) {
        console.error('Firebase redirect error:', error);
        let errorMessage = "Failed to complete Google sign-in. Please try again.";
        
        if (error.message?.includes('auth/unauthorized-domain')) {
          errorMessage = "Domain not authorized in Firebase console. Please contact support.";
        }
        
        toast({
          title: "Sign-in Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    handleRedirect();

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? { uid: user.uid, email: user.email } : null);
      setUser(user);
      setLoading(false);
      onAuthChange?.(user);
    });

    return () => unsubscribe();
  }, [onAuthChange, toast]);

  const getFirebaseErrorMessage = (error: any) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please create an account first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Popup was blocked. Please allow popups for this site and try again.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized. Please contact support.';
      default:
        return error.message || 'An error occurred during authentication.';
    }
  };

  const handleGoogleSignIn = async (usePopup = false) => {
    try {
      setAuthLoading(true);
      const result = await signInWithGoogle(usePopup);
      
      if (result && usePopup) {
        toast({
          title: "Welcome!",
          description: `Signed in as ${result.user.displayName || result.user.email}`,
        });
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Sign-in Error",
        description: getFirebaseErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAppleSignIn = async (usePopup = true) => {
    try {
      setAuthLoading(true);
      const result = await signInWithApple(usePopup);
      
      if (result && usePopup) {
        toast({
          title: "Welcome!",
          description: `Signed in as ${result.user.displayName || result.user.email}`,
        });
      }
    } catch (error: any) {
      console.error("Apple sign-in error:", error);
      toast({
        title: "Sign-in Error", 
        description: getFirebaseErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match.",
          variant: "destructive",
        });
        return;
      }
      
      if (password.length < 6) {
        toast({
          title: "Weak Password",
          description: "Password should be at least 6 characters long.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setAuthLoading(true);
      
      if (authMode === 'signin') {
        const result = await signInWithEmail(email, password);
        toast({
          title: "Welcome back!",
          description: `Signed in as ${result.user.email}`,
        });
      } else if (authMode === 'signup') {
        const result = await signUpWithEmail(email, password, displayName);
        toast({
          title: "Account Created!",
          description: `Welcome to MLSBharat, ${displayName || email}!`,
        });
      } else if (authMode === 'reset') {
        await resetPassword(email);
        toast({
          title: "Reset Email Sent",
          description: "Check your email for password reset instructions.",
        });
        setAuthMode('signin');
      }
      
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
    } catch (error: any) {
      console.error("Email auth error:", error);
      toast({
        title: "Authentication Error",
        description: getFirebaseErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error("Sign-out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {user ? "Account" : authMode === 'signin' ? "Sign In" : authMode === 'signup' ? "Create Account" : "Reset Password"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <div className="space-y-4">
            <div className="text-center">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-16 h-16 rounded-full mx-auto mb-2"
                />
              )}
              <h3 className="font-semibold">{user.displayName || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Social Sign-in Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => handleGoogleSignIn(true)}
                variant="outline"
                className="w-full"
                disabled={authLoading}
              >
                <SiGoogle className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>

              <Button
                onClick={() => handleAppleSignIn(true)}
                variant="outline"
                className="w-full"
                disabled={authLoading}
              >
                <SiApple className="h-4 w-4 mr-2" />
                Continue with Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={authLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={authLoading}
                />
              </div>

              {authMode !== 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={authLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={authLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={authLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={authLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={authLoading}
              >
                {authLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                ) : authMode === 'signin' ? (
                  <LogIn className="h-4 w-4 mr-2" />
                ) : authMode === 'signup' ? (
                  <UserPlus className="h-4 w-4 mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                {authMode === 'signin' && 'Sign In with Email'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'reset' && 'Send Reset Email'}
              </Button>
            </form>

            {/* Mode Switcher */}
            <div className="text-center space-y-2">
              {authMode === 'signin' && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal text-sm"
                      onClick={() => setAuthMode('signup')}
                      disabled={authLoading}
                    >
                      Create one
                    </Button>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Forgot your password?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal text-sm"
                      onClick={() => setAuthMode('reset')}
                      disabled={authLoading}
                    >
                      Reset it
                    </Button>
                  </p>
                </>
              )}
              
              {authMode === 'signup' && (
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal text-sm"
                    onClick={() => setAuthMode('signin')}
                    disabled={authLoading}
                  >
                    Sign in
                  </Button>
                </p>
              )}
              
              {authMode === 'reset' && (
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal text-sm"
                    onClick={() => setAuthMode('signin')}
                    disabled={authLoading}
                  >
                    Sign in
                  </Button>
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FirebaseAuth;