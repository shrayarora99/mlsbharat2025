import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { PropertyWithOwnerAndImages } from "@shared/schema";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Home, LogOut, Settings, ArrowLeft, Bed, Bath, MapPin, Phone, Accessibility, CheckCircle } from "lucide-react";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { useState } from "react";

export default function PropertyDetails() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/property/:id");
  const propertyId = params?.id;
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);

  const { data: property, isLoading: propertyLoading, error } = useQuery<PropertyWithOwnerAndImages>({
    queryKey: ["/api/properties", propertyId],
    enabled: !!propertyId,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view property details.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view property details.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [error, toast]);

  const contactOwner = () => {
    if (!property) return;
    
    const message = encodeURIComponent(`Hi, I'm interested in ${property.title} listed on BharatMLS. Can you share more details?`);
    const phoneNumber = property.owner.phoneNumber?.replace(/\D/g, '');
    
    if (!phoneNumber) {
      toast({
        title: "Contact Information Missing",
        description: "Phone number is not available for this property.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure phone number starts with country code
    const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = "/";
    }
  };

  if (isLoading || propertyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <img src="@assets/LOGO estate empire_1753301976738.png" alt="Estate Empire Logo" className="h-10 w-10 mr-3 rounded-full" />
            <h1 className="text-2xl font-bold text-primary">MLSBharat</h1>
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost">Home</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
            <p className="text-gray-600">The property you're looking for doesn't exist or has been removed.</p>
            <Link href="/" className="mt-4 inline-block">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src="@assets/LOGO estate empire_1753301976738.png" alt="Estate Empire Logo" className="h-10 w-10 mr-3 rounded-full" />
              <h1 className="text-2xl font-bold text-primary">MLSBharat</h1>
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  <Home className="w-4 h-4 inline mr-1" />
                  Home
                </Link>
                <span className="text-primary px-3 py-2 text-sm font-medium">Property Details</span>
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
              <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-gray-600 hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Link>
        </div>

        <Card className="card-mlsbharat">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Section */}
              <div className="p-6">
                <div className="aspect-video mb-4">
                  {property.images && property.images.length > 0 ? (
                    <ImageCarousel 
                      images={property.images.map(img => img.imageUrl)}
                      alt={property.title}
                      className="h-full"
                    />
                  ) : property.imageUrl ? (
                    <ImageCarousel 
                      images={[property.imageUrl]}
                      alt={property.title}
                      className="h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                      <Home className="w-16 h-16" />
                    </div>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                  <div className="flex flex-col space-y-2">
                    <Badge className={property.isVerified ? "bg-accent" : "bg-yellow-500"}>
                      {property.isVerified ? "Verified" : property.status}
                    </Badge>
                    <VerificationBadge 
                      isVerified={property.owner.role === 'broker' && (property.owner as any).isVerified}
                      reraId={(property.owner as any).reraId}
                      size="md"
                    />
                  </div>
                </div>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{property.location}</span>
                </div>

                <div className="text-4xl font-bold text-primary mb-6">
                  ₹{property.price}/month
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Bed className="w-5 h-5 text-primary mr-2" />
                      <span className="text-sm text-gray-600">Bedrooms</span>
                    </div>
                    <div className="font-semibold">{property.bedrooms || 'N/A'}</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Bath className="w-5 h-5 text-primary mr-2" />
                      <span className="text-sm text-gray-600">Bathrooms</span>
                    </div>
                    <div className="font-semibold">{property.bathrooms || 'N/A'}</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Home className="w-5 h-5 text-primary mr-2" />
                      <span className="text-sm text-gray-600">Type</span>
                    </div>
                    <div className="font-semibold capitalize">{property.propertyType}</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-gray-600">Owner</span>
                    </div>
                    <div className="font-semibold capitalize">{property.owner.role}</div>
                    <div className="text-sm text-gray-500">
                      {property.owner.firstName} {property.owner.lastName}
                    </div>
                    {property.owner.role === 'broker' && (property.owner as any).reraId && (
                      <div className="text-xs text-gray-400 mt-1">
                        RERA: {(property.owner as any).reraId}
                      </div>
                    )}
                  </div>
                </div>

                {property.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{property.description}</p>
                  </div>
                )}

                {/* RERA Verification Section */}
                {property.owner.role === 'broker' && (property.owner as any).isVerified && (property.owner as any).reraId && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-green-800">Listed by a RERA Verified Broker</h3>
                    </div>
                    <p className="text-green-700">
                      This property is listed by a broker whose RERA ID has been verified by MLSBharat.
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      <strong>RERA ID:</strong> {(property.owner as any).reraId}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    className="btn-primary w-full bg-green-600 hover:bg-green-700 text-lg py-3 disabled:bg-gray-400"
                    onClick={contactOwner}
                    disabled={!property.owner.phoneNumber}
                  >
                    📱 Contact via WhatsApp
                  </Button>
                  
                  {property.owner.phoneNumber ? (
                    <Button 
                      className="btn-secondary w-full"
                      onClick={() => window.open(`tel:${property.owner.phoneNumber}`, '_self')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call {property.owner.role === 'broker' ? 'Broker' : 'Owner'}
                    </Button>
                  ) : (
                    <div className="text-center text-sm text-gray-500 py-2">
                      Contact information not available
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Owner Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {property.owner.firstName} {property.owner.lastName}</p>
                    <p><strong>Role:</strong> <span className="capitalize">{property.owner.role}</span></p>
                    {property.owner.email && (
                      <p><strong>Email:</strong> {property.owner.email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
