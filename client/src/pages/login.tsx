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
import { useLocation } from "wouter";
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  UserPlus,
  RotateCcw,
  ArrowLeft
} from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

type AuthMode = 'signin' | 'signup' | 'reset';

export default function Login() {
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
  const [, setLocation] = useLocation();

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? { uid: user.uid, email: user.email } : null);
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Check if user has a role and redirect accordingly
        try {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.role) {
              // User has a role, redirect to appropriate dashboard
              if (userData.role === 'tenant') {
                setLocation('/');
              } else {
                setLocation('/broker-dashboard');
              }
            } else {
              // User needs to select a role
              setLocation('/role-selection');
            }
          } else {
            // User not found in database, needs role selection
            setLocation('/role-selection');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          setLocation('/role-selection');
        }
      }
    });

    return () => unsubscribe();
  }, [toast, setLocation]);

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

  const handleGoogleSignIn = async (usePopup = true) => {
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
    
    if (!email || (!password && authMode !== 'reset')) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is already logged in, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-100 opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-100 opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to home link */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card className="card-mlsbharat shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            
            <CardTitle className="text-2xl font-bold text-gray-900">
              {authMode === 'signin' ? "Welcome Back" : authMode === 'signup' ? "Create Account" : "Reset Password"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {authMode === 'signin' ? "Sign in to your MLSBharat account" : 
               authMode === 'signup' ? "Join the MLSBharat community" : 
               "Enter your email to reset your password"}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-2">
            {/* Social Sign-in Buttons */}
            {authMode !== 'reset' && (
              <div className="space-y-3">
                <Button
                  onClick={() => handleGoogleSignIn(true)}
                  variant="outline"
                  className="btn-secondary w-full h-12 text-base"
                  disabled={authLoading}
                >
                  <SiGoogle className="h-5 w-5 mr-3 text-red-500" />
                  Continue with Google
                </Button>

                <Button
                  onClick={() => handleAppleSignIn(true)}
                  variant="outline"
                  className="btn-secondary w-full h-12 text-base"
                  disabled={authLoading}
                >
                  <SiApple className="h-5 w-5 mr-3 text-gray-700" />
                  Continue with Apple
                </Button>
              </div>
            )}

            {authMode !== 'reset' && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-muted-foreground font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                    Display Name (Optional)
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={authLoading}
                    className="h-12"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={authLoading}
                  className="h-12"
                />
              </div>

              {authMode !== 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={authLoading}
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
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
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={authLoading}
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
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
                className="btn-primary w-full h-12 text-base"
                disabled={authLoading}
              >
                {authLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : authMode === 'signin' ? (
                  <LogIn className="h-5 w-5 mr-2" />
                ) : authMode === 'signup' ? (
                  <UserPlus className="h-5 w-5 mr-2" />
                ) : (
                  <RotateCcw className="h-5 w-5 mr-2" />
                )}
                {authMode === 'signin' && 'Sign In'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'reset' && 'Send Reset Email'}
              </Button>
            </form>

            {/* Mode Switcher */}
            <div className="text-center space-y-3 pt-2">
              {authMode === 'signin' && (
                <>
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                      onClick={() => setAuthMode('signup')}
                      disabled={authLoading}
                    >
                      Create one
                    </Button>
                  </p>
                  <p className="text-sm text-gray-600">
                    Forgot your password?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                      onClick={() => setAuthMode('reset')}
                      disabled={authLoading}
                    >
                      Reset it
                    </Button>
                  </p>
                </>
              )}
              
              {authMode === 'signup' && (
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                    onClick={() => setAuthMode('signin')}
                    disabled={authLoading}
                  >
                    Sign in
                  </Button>
                </p>
              )}
              
              {authMode === 'reset' && (
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                    onClick={() => setAuthMode('signin')}
                    disabled={authLoading}
                  >
                    Sign in
                  </Button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>By continuing, you agree to MLSBharat's Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
