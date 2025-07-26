import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { Home, Handshake, Search, CheckCircle, AlertCircle, Accessibility } from "lucide-react";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import logoPath from "@assets/LOGO estate empire_1753301976738.png";

const roleSelectionSchema = z.object({
  role: z.enum(['tenant', 'landlord', 'broker']),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  reraId: z.string().optional(),
}).refine((data) => {
  if (data.role === 'broker') {
    return data.reraId && data.reraId.length > 0;
  }
  return true;
}, {
  message: "RERA Registration Number is required for brokers",
  path: ["reraId"],
});

type RoleSelectionFormData = z.infer<typeof roleSelectionSchema>;

export default function RoleSelection() {
  const { user, isLoading, refetch } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);

  const form = useForm<RoleSelectionFormData>({
    resolver: zodResolver(roleSelectionSchema),
    defaultValues: {
      role: undefined,
      phoneNumber: (user as any)?.phoneNumber || '',
      reraId: (user as any)?.reraId || '',
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: RoleSelectionFormData) => {
      try {
        console.log('Submitting role update with data:', data);
        
        // Get Firebase user for auth token
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          throw new Error('Please sign in first');
        }
        
        const token = await firebaseUser.getIdToken();
        
        const response = await fetch('/api/auth/update-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        
        console.log('Role update response status:', response.status);
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            console.error('Role update error data:', errorData);
            errorMessage = errorData.message || errorMessage;
          } catch {
            const errorText = await response.text();
            console.error('Role update error text:', errorText);
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Role update successful:', result);
        return result;
      } catch (error) {
        console.error('Role update error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Role update mutation succeeded:', data);
      toast({
        title: selectedRole === 'broker' 
          ? "Broker Registration Submitted! 🎉"
          : "Profile Updated Successfully! 🎉",
        description: selectedRole === 'broker' 
          ? "Your RERA verification is pending admin approval. You'll be notified once verified!"
          : `Welcome to MLSBharat as a ${selectedRole}! Redirecting to your dashboard...`,
        duration: 3000,
      });
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      refetch();
      
      // Redirect based on role
      setTimeout(() => {
        if (data.role === 'landlord' || data.role === 'broker') {
          window.location.href = '/broker-dashboard';
        } else if (data.role === 'tenant') {
          window.location.href = '/';
        } else {
          window.location.href = '/';
        }
      }, 500);
    },
    onError: (error: any) => {
      console.error('Role update mutation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RoleSelectionFormData) => {
    console.log('Submitting role selection data:', data);
    setSelectedRole(data.role);
    updateRoleMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logoPath} alt="Estate Empire Logo" className="h-10 w-10 mr-3 rounded-full" />
              <h1 className="text-2xl font-bold text-primary">MLSBharat</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {(user as any)?.firstName || (user as any)?.email}
              </span>
              {(user as any)?.role && <Badge variant="secondary">{(user as any).role}</Badge>}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAccessibilityPanelOpen(true)}
                aria-label="Open accessibility settings"
                title="Accessibility Settings"
              >
                <Accessibility className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {(user as any)?.role ? 'Update Your Profile' : 'Complete Your Profile'}
          </h1>
          <p className="text-xl text-gray-600">
            {(user as any)?.role 
              ? 'Change your role or update your information' 
              : 'Choose your role and provide additional information'
            }
          </p>
          {(user as any)?.role && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                Current role: <strong className="capitalize">{(user as any).role}</strong>. 
                You can change to Landlord or Broker to start listing properties.
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Role Selection Cards */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select Your Role</h2>

            <Card 
              className={`card-mlsbharat cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                form.watch('role') === 'tenant' 
                  ? 'ring-2 ring-primary bg-blue-50 border-primary' 
                  : 'hover:border-primary/30'
              }`}
              onClick={() => form.setValue('role', 'tenant')}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tenant</h3>
                    <p className="text-gray-600">Find your perfect home</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`card-mlsbharat cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                form.watch('role') === 'landlord' 
                  ? 'ring-2 ring-primary bg-blue-50 border-primary' 
                  : 'hover:border-primary/30'
              }`}
              onClick={() => form.setValue('role', 'landlord')}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Home className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Landlord</h3>
                    <p className="text-gray-600">List your premium properties</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`card-mlsbharat cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                form.watch('role') === 'broker' 
                  ? 'ring-2 ring-primary bg-blue-50 border-primary' 
                  : 'hover:border-primary/30'
              }`}
              onClick={() => form.setValue('role', 'broker')}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Handshake className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Broker</h3>
                    <p className="text-gray-600">Manage client portfolios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div>
            <Card className="card-mlsbharat">
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your phone number" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('role') === 'broker' && (
                      <FormField
                        control={form.control}
                        name="reraId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RERA Registration Number *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your RERA ID (e.g., RERA-DL-2024-001234)" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                            <div className="flex items-start space-x-2 mt-2 p-3 bg-amber-50 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                              <div className="text-sm text-amber-700">
                                <p className="font-medium">Admin Verification Required</p>
                                <p>Your broker registration will be reviewed by our admin team before you can list properties.</p>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}

                    {updateRoleMutation.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        Error: {updateRoleMutation.error.message}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="btn-primary w-full"
                      disabled={updateRoleMutation.isPending || !form.watch('role')}
                    >
                      {updateRoleMutation.isPending ? 'Updating...' : 'Complete Profile'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <AccessibilityPanel 
        isOpen={accessibilityPanelOpen} 
        onClose={() => setAccessibilityPanelOpen(false)} 
      />
    </div>
  );
}