import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertPropertySchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, LogOut, Settings, Upload, ArrowLeft, Accessibility } from "lucide-react";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { z } from "zod";

const createListingSchema = insertPropertySchema.extend({
  phoneNumber: z.string().min(10, "Phone number is required"),
}).omit({ ownerId: true });

type CreateListingFormData = z.infer<typeof createListingSchema>;

export default function CreateListing() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);

  const form = useForm<CreateListingFormData>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      location: "",
      propertyType: "",
      listingType: "",
      bedrooms: undefined,
      bathrooms: undefined,
      phoneNumber: (user as any)?.phoneNumber || "",
    },
  });

  useEffect(() => {
    if (!isLoading && (!user || !['landlord', 'broker'].includes((user as any).role))) {
      toast({
        title: "Unauthorized",
        description: "Only landlords and brokers can create listings.",
        variant: "destructive",
      });
      setTimeout(() => {
        navigate("/");
      }, 500);
      return;
    }
  }, [user, isLoading, toast, navigate]);

  const createListingMutation = useMutation({
    mutationFn: async (data: CreateListingFormData) => {
      console.log('Form data being submitted:', data);
      console.log('Selected images:', selectedImages);
      
      const formData = new FormData();
      
      // Add all form fields
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('price', data.price);
      formData.append('location', data.location);
      formData.append('propertyType', data.propertyType);
      formData.append('listingType', data.listingType);
      if (data.bedrooms) formData.append('bedrooms', data.bedrooms.toString());
      if (data.bathrooms) formData.append('bathrooms', data.bathrooms.toString());
      formData.append('phoneNumber', data.phoneNumber);
      
      // Add images
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      // Debug: Log FormData contents
      console.log('FormData contents:');
      formData.forEach((value, key) => {
        console.log(key, value);
      });

      const response = await fetch("/api/properties", {
        method: "POST",
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create property');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Property Listed Successfully! 🎉",
        description: "Your listing has been submitted for admin review. You'll be notified once it's approved!",
        duration: 4000,
      });
      form.reset();
      setSelectedImages([]);
      navigate("/broker-dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Listing Creation Failed",
        description: error?.message || "Something went wrong. Please check your details and try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedImages.length > 10) {
      toast({
        title: "Error",
        description: "Maximum 10 images allowed per property.",
        variant: "destructive",
      });
      return;
    }
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Each file must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    import("@/lib/authHelpers").then(({ handleLogout }) => handleLogout());
  };

  const onSubmit = (data: CreateListingFormData) => {
    if (!(user as any)?.phoneNumber && !data.phoneNumber) {
      toast({
        title: "Error",
        description: "Phone number is required for property listings.",
        variant: "destructive",
      });
      return;
    }

    createListingMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !['landlord', 'broker'].includes((user as any).role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src="@assets/LOGO estate empire_1753301976738.png" alt="Estate Empire Logo" className="h-12 w-12 mr-3 rounded-lg object-contain" />
              <h1 className="text-2xl font-bold text-primary">MLSBharat</h1>
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  <Home className="w-4 h-4 inline mr-1" />
                  Home
                </Link>
                {(user as any)?.role === 'admin' && (
                  <Link href="/admin" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/broker-dashboard" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  My Listings
                </Link>
                <span className="text-primary px-3 py-2 text-sm font-medium">Create Listing</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {(user as any).firstName || (user as any).email}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAccessibilityPanelOpen(true)}
                aria-label="Open accessibility settings"
                title="Accessibility Settings"
              >
                <Accessibility className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Settings">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-gray-600 hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card className="card-mlsbharat">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900">Create Property Listing</CardTitle>
            <p className="text-gray-600">Fill in the details to list your property</p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter property title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter price" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="office">Office</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="listingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select listing type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rent">For Rent</SelectItem>
                            <SelectItem value="sale">For Sale</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Bedroom</SelectItem>
                            <SelectItem value="2">2 Bedrooms</SelectItem>
                            <SelectItem value="3">3 Bedrooms</SelectItem>
                            <SelectItem value="4">4+ Bedrooms</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Bathroom</SelectItem>
                            <SelectItem value="2">2 Bathrooms</SelectItem>
                            <SelectItem value="3">3 Bathrooms</SelectItem>
                            <SelectItem value="4">4+ Bathrooms</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be used for WhatsApp contact by interested tenants.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label htmlFor="images">Property Images</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Upload property images (max 10)</p>
                    <input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      className="btn-secondary"
                      onClick={() => document.getElementById('images')?.click()}
                      disabled={selectedImages.length >= 10}
                    >
                      Choose Images
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedImages.length}/10 images selected
                    </p>
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Images:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Property ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {image.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your property..." 
                          rows={4}
                          {...field}
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    className="btn-primary"
                    disabled={createListingMutation.isPending}
                  >
                    {createListingMutation.isPending ? "Submitting..." : "Submit for Review"}
                  </Button>
                  <Button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      <AccessibilityPanel 
        isOpen={accessibilityPanelOpen} 
        onClose={() => setAccessibilityPanelOpen(false)} 
      />
    </div>
  );
}
