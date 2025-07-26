import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { PropertyWithOwnerAndImages } from "@shared/schema";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Home as HomeIcon, Plus, Settings, LogOut, Search, Filter, Camera, Accessibility } from "lucide-react";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    propertyType: "",
    listingType: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
  });
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);

  const { data: properties = [], isLoading: propertiesLoading, error } = useQuery<PropertyWithOwnerAndImages[]>({
    queryKey: ["/api/properties"],
    retry: false,
  });

  const { data: searchResults = [], refetch: searchProperties } = useQuery<PropertyWithOwnerAndImages[]>({
    queryKey: ["/api/properties/search", searchFilters],
    enabled: false,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [error, toast]);

  const handleSearch = () => {
    searchProperties();
  };

  const contactOwner = (property: PropertyWithOwnerAndImages) => {
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

  const handleLogout = () => {
    import('@/lib/authHelpers').then(({ handleLogout }) => handleLogout());
  };

  const displayProperties = searchResults.length > 0 ? searchResults : properties;

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
      <nav className="glass-effect shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src="@assets/LOGO estate empire_1753301976738.png" alt="Estate Empire Logo" className="h-12 w-12 mr-3 rounded-lg object-contain" />
              <h1 className="text-2xl font-bold text-primary">MLSBharat</h1>
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  <HomeIcon className="w-4 h-4 inline mr-1" />
                  Home
                </Link>
                {(user as any)?.role === 'admin' && (
                  <Link href="/admin" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                    Admin Dashboard
                  </Link>
                )}
                {((user as any)?.role === 'landlord' || (user as any)?.role === 'broker') && (
                  <>
                    <Link href="/broker-dashboard" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                      My Listings
                    </Link>
                    <Link href="/create-listing" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                      <Plus className="w-4 h-4 inline mr-1" />
                      List Property
                    </Link>
                  </>
                )}
                <Link href="/firebase-auth" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  Firebase Demo
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {(user as any)?.firstName || (user as any)?.email}
              </span>
              <Badge variant="secondary">{(user as any)?.role}</Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAccessibilityPanelOpen(true)}
                aria-label="Open accessibility settings"
                title="Accessibility Settings"
              >
                <Accessibility className="w-4 h-4" />
              </Button>
              <Link href="/role-selection">
                <Button variant="ghost" size="sm" title="Change Role">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="estate-gradient text-white py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect Property
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Discover premium real estate listings in Delhi NCR
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="card-mlsbharat">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Search Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Input 
                    placeholder="Enter location" 
                    value={searchFilters.location}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                  <Select value={searchFilters.propertyType} onValueChange={(value) => setSearchFilters({...searchFilters, propertyType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type</label>
                  <Select value={searchFilters.listingType} onValueChange={(value) => setSearchFilters({...searchFilters, listingType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rent/Sale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">For Rent</SelectItem>
                      <SelectItem value="sale">For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                  <Input 
                    type="number"
                    placeholder="Min Price" 
                    value={searchFilters.minPrice}
                    onChange={(e) => setSearchFilters({...searchFilters, minPrice: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                  <Input 
                    type="number"
                    placeholder="Max Price" 
                    value={searchFilters.maxPrice}
                    onChange={(e) => setSearchFilters({...searchFilters, maxPrice: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button className="btn-primary w-full" onClick={handleSearch}>
                    <Filter className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Properties Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Available Properties</h2>
            <div className="flex space-x-2">
              {((user as any)?.role === 'landlord' || (user as any)?.role === 'broker') ? (
                <Link href="/create-listing">
                  <Button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Property
                  </Button>
                </Link>
              ) : (
                <Link href="/role-selection">
                  <Button className="btn-secondary">
                    Become a Broker/Landlord
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertiesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="flex space-x-2">
                      <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                      <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : displayProperties.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500">No properties found.</div>
                <p className="text-sm text-gray-400 mt-2">
                  {searchResults.length > 0 
                    ? "Try adjusting your search filters." 
                    : "Properties will appear here once they are approved by our admin team."
                  }
                </p>
              </div>
            ) : (
              displayProperties.map((property) => (
                <Card key={property.id} className="card-mlsbharat property-card transition-shadow">
                  <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden relative">
                    {property.images && property.images.length > 0 ? (
                      <>
                        <img 
                          src={property.images[0].imageUrl} 
                          alt={property.title} 
                          className="w-full h-full object-cover"
                        />
                        {property.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {property.images.length}
                          </div>
                        )}
                      </>
                    ) : property.imageUrl ? (
                      <img 
                        src={property.imageUrl} 
                        alt={property.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{property.title}</h3>
                      <div className="flex flex-col space-y-1">
                        <Badge className={property.listingType === 'rent' ? "bg-blue-500" : "bg-purple-500"}>
                          {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
                        </Badge>
                        <Badge className={property.isVerified ? "bg-accent" : "bg-yellow-500"}>
                          {property.isVerified ? "Verified" : "Pending"}
                        </Badge>
                        {property.owner.role === 'broker' && (
                          <VerificationBadge 
                            isVerified={(property.owner as any).isVerified}
                            reraId={(property.owner as any).reraId}
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{property.location}</p>
                    <div className="text-sm text-gray-500 mb-2">
                      Listed by: {property.owner.firstName} {property.owner.lastName} ({property.owner.role})
                      {property.owner.role === 'broker' && (property.owner as any).reraId && (
                        <span className="block">RERA ID: {(property.owner as any).reraId}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">
                        ₹{property.price}{property.listingType === 'rent' ? '/month' : ''}
                      </span>
                      <div className="flex items-center space-x-4 text-gray-600">
                        {property.bedrooms && <span>🛏️ {property.bedrooms}</span>}
                        {property.bathrooms && <span>🚿 {property.bathrooms}</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/property/${property.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        className="flex-1 whatsapp-btn text-white"
                        onClick={() => contactOwner(property)}
                      >
                        📱 Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
      
      <AccessibilityPanel 
        isOpen={accessibilityPanelOpen} 
        onClose={() => setAccessibilityPanelOpen(false)} 
      />
    </div>
  );
}
