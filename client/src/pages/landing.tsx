import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, MessageCircle, Filter, Home, Handshake, Search, Phone, Mail, MapPin, LogIn } from "lucide-react";
import logoPath from "../assets/mls-logo.png";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PropertyWithOwner } from "@shared/schema";


export default function Landing() {
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    propertyType: "",
    priceRange: "",
  });

  const { data: properties = [], isLoading } = useQuery<PropertyWithOwner[]>({
    queryKey: ["/api/properties"],
  });

  const contactOwner = (property: PropertyWithOwner) => {
    const message = encodeURIComponent(`Hi, I'm interested in your property listing "${property.title}" on MLSBharat. Could you please share more details?`);
    const phoneNumber = property.owner.phoneNumber?.replace(/\D/g, '') || "919876543210";
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleGetStarted = () => {
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logoPath} alt="Estate Empire Logo" className="h-12 w-12 mr-3 rounded-lg object-contain" />
              <h1 className="text-2xl font-bold text-primary">MLSBharat</h1>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a href="#" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">Home</a>
              <a href="#properties" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">Properties</a>
              <a href="#about" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">About</a>
              <a href="#contact" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">Contact</a>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="btn-secondary"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="btn-primary"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <img src={logoPath} alt="Estate Empire Logo" className="h-24 w-24 mr-6 rounded-xl object-contain shadow-2xl bg-white/10 backdrop-blur-sm" />
              <h1 className="text-6xl md:text-7xl font-black tracking-tight">
                MLSBharat
              </h1>
            </div>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-2xl mx-auto font-light">
              Your trusted partner for premium real estate in Delhi NCR
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="card-mlsbharat bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group" onClick={handleGetStarted}>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Landlord</h3>
                  <p className="text-blue-100 text-sm">List your premium properties</p>
                </CardContent>
              </Card>

              <Card className="card-mlsbharat bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group" onClick={handleGetStarted}>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                    <Handshake className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Broker</h3>
                  <p className="text-blue-100 text-sm">Manage client portfolios</p>
                </CardContent>
              </Card>

              <Card className="card-mlsbharat bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group" onClick={handleGetStarted}>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Tenant</h3>
                  <p className="text-blue-100 text-sm">Find your perfect home</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Why Choose MLSBharat?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Experience the difference with our premium features</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 border-0 shadow-lg group">
              <CardContent className="p-0">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Verified Listings</h3>
                <p className="text-gray-600 leading-relaxed">All properties are thoroughly verified by our admin team before going live, ensuring quality and authenticity</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 border-0 shadow-lg group">
              <CardContent className="p-0">
                <div className="w-20 h-20 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Direct Broker Contact</h3>
                <p className="text-gray-600 leading-relaxed">Connect directly with property owners and brokers through WhatsApp integration for instant communication</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-xl transition-all duration-300 border-0 shadow-lg group">
              <CardContent className="p-0">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Filter className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No Fakes No Redundancy</h3>
                <p className="text-gray-600 leading-relaxed">Our strict verification process eliminates fake listings and duplicate entries, ensuring genuine property listings only</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Properties</h2>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => window.location.href = '#'}
            >
              View All Properties
            </Button>
          </div>
          
          {/* Search Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <Select value={searchFilters.priceRange} onValueChange={(value) => setSearchFilters({...searchFilters, priceRange: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000-25000">₹10,000 - ₹25,000</SelectItem>
                      <SelectItem value="25000-50000">₹25,000 - ₹50,000</SelectItem>
                      <SelectItem value="50000-100000">₹50,000 - ₹1,00,000</SelectItem>
                      <SelectItem value="100000+">₹1,00,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
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
            ) : properties.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500">No properties available at the moment.</div>
                <p className="text-sm text-gray-400 mt-2">Properties will appear here once they are approved by our admin team.</p>
              </div>
            ) : (
              properties.slice(0, 6).map((property) => (
                <Card key={property.id} className="property-card hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {property.imageUrl && (
                      <img 
                        src={property.imageUrl} 
                        alt={property.title} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{property.title}</h3>
                      <Badge className={property.isVerified ? "bg-accent" : "bg-yellow-500"}>
                        {property.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{property.location}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">₹{property.price}/month</span>
                      <div className="flex items-center space-x-4 text-gray-600">
                        {property.bedrooms && <span>🛏️ {property.bedrooms} Beds</span>}
                        {property.bathrooms && <span>🚿 {property.bathrooms} Baths</span>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => window.location.href = `/property/${property.id}`}
                      >
                        View Details
                      </Button>
                      <Button 
                        className="flex-1 whatsapp-btn text-white hover:whatsapp-btn"
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

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={logoPath} alt="Estate Empire Logo" className="h-10 w-10 mr-3 rounded-full" />
                <h3 className="text-2xl font-bold">MLSBharat</h3>
              </div>
              <p className="text-gray-400">India's premier real estate platform connecting landlords, brokers, and tenants.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Home</a></li>
                <li><a href="#properties" className="hover:text-white">Properties</a></li>
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Property Listing</a></li>
                <li><a href="#" className="hover:text-white">Property Search</a></li>
                <li><a href="#" className="hover:text-white">Verification</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="text-gray-400 space-y-2">
                <p className="flex items-center"><Mail className="w-4 h-4 mr-2" />info@mlsbharat.com</p>
                <p className="flex items-center"><Phone className="w-4 h-4 mr-2" />+91 9876543210</p>
                <p className="flex items-center"><MapPin className="w-4 h-4 mr-2" />Delhi NCR, India</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MLSBharat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
