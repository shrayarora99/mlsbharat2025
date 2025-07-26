import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PropertyWithOwnerAndImages } from "@shared/schema";
import { useEffect } from "react";
import { Link } from "wouter";
import { Home, LogOut, Settings, Plus, Eye, CheckCircle, XCircle, Calendar, Camera, Accessibility } from "lucide-react";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { useState } from "react";

export default function BrokerDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);

  const { data: properties = [], isLoading: propertiesLoading, error } = useQuery<PropertyWithOwnerAndImages[]>({
    queryKey: ["/api/properties/owner", (user as any)?.id],
    enabled: !!(user as any)?.id,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (!user || !['landlord', 'broker'].includes((user as any).role))) {
      toast({
        title: "Unauthorized",
        description: "This dashboard is only for landlords and brokers.",
        variant: "destructive",
      });
      return;
    }
  }, [user, isLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access your dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [error, toast]);

  const updateListingStatusMutation = useMutation({
    mutationFn: async ({ propertyId, listingStatus }: { propertyId: number; listingStatus: string }) => {
      await apiRequest("PATCH", `/api/properties/${propertyId}/status`, { listingStatus });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Property status updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/owner", (user as any)?.id] });
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
        title: "Error",
        description: "Failed to update property status.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (propertyId: number, status: string) => {
    updateListingStatusMutation.mutate({ propertyId, listingStatus: status });
  };

  const handleLogout = () => {
    import('@/lib/authHelpers').then(({ handleLogout }) => handleLogout());
  };

  const getStatusBadge = (property: PropertyWithOwnerAndImages) => {
    const { status, listingStatus, needsReview } = property;
    
    if (needsReview) {
      return <Badge variant="destructive">Needs Review</Badge>;
    }
    
    if (status === "pending") {
      return <Badge className="bg-yellow-500">Pending Approval</Badge>;
    }
    
    if (status === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    
    switch (listingStatus) {
      case "active":
        return <Badge className="bg-green-600">Active</Badge>;
      case "sold":
        return <Badge className="bg-blue-600">Sold</Badge>;
      case "rented":
        return <Badge className="bg-purple-600">Rented</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getDaysOld = (createdAt: Date | null) => {
    if (!createdAt) return 0;
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading || propertiesLoading) {
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
                <span className="text-primary px-3 py-2 text-sm font-medium">My Listings</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {(user as any).firstName || (user as any).email}</span>
              <Badge variant="secondary">{(user as any).role}</Badge>
              {(user as any).role === 'broker' && (
                <VerificationBadge 
                  isVerified={(user as any).isVerified}
                  reraId={(user as any).reraId}
                />
              )}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Property Listings</h1>
            <p className="text-gray-600 mt-1">
              Manage your property listings and update their status
            </p>
          </div>
          <Link href="/create-listing">
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add New Listing
            </Button>
          </Link>
        </div>

        {/* Auto-expiry reminder */}
        {properties.some(p => getDaysOld(p.createdAt) > 30 && p.listingStatus === "active") && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Some listings need status confirmation
                </h3>
                <p className="text-sm text-yellow-700">
                  Properties older than 30 days should have their status confirmed to stay active.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <Card className="card-mlsbharat">
            <CardContent className="p-8 text-center">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Listed</h3>
              <p className="text-gray-600 mb-4">
                You haven't created any property listings yet.
              </p>
              <Link href="/create-listing">
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Listing
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => {
              const daysOld = getDaysOld(property.createdAt);
              const needsReview = daysOld > 30 && property.listingStatus === "active";
              
              return (
                <Card key={property.id} className="overflow-hidden">
                  <div className="relative">
                    <div className="h-48 bg-gray-200 overflow-hidden">
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
                    <div className="absolute top-2 left-2">
                      {getStatusBadge(property)}
                    </div>
                    {needsReview && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive" className="text-xs">
                          {daysOld} days old
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-1">{property.location}</p>
                    <Badge className={property.listingType === 'rent' ? "bg-blue-500 mb-2" : "bg-purple-500 mb-2"}>
                      {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
                    </Badge>
                    <div className="text-xl font-bold text-primary mb-4">
                      ₹{property.price}{property.listingType === 'rent' ? '/month' : ''}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                      <div>Type: {property.propertyType}</div>
                      <div>Beds: {property.bedrooms || 'N/A'}</div>
                    </div>

                    {/* Status Actions */}
                    {property.status === "approved" && property.listingStatus === "active" && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleStatusUpdate(property.id, "sold")}
                            disabled={updateListingStatusMutation.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Mark Sold
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleStatusUpdate(property.id, "rented")}
                            disabled={updateListingStatusMutation.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Mark Rented
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleStatusUpdate(property.id, "inactive")}
                          disabled={updateListingStatusMutation.isPending}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Mark Inactive
                        </Button>
                      </div>
                    )}

                    {(property.listingStatus === "sold" || property.listingStatus === "rented" || property.listingStatus === "inactive") && (
                      <Button 
                        size="sm" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(property.id, "active")}
                        disabled={updateListingStatusMutation.isPending}
                      >
                        Reactivate Listing
                      </Button>
                    )}

                    <div className="mt-3 pt-3 border-t">
                      <Link href={`/property/${property.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      <AccessibilityPanel 
        isOpen={accessibilityPanelOpen} 
        onClose={() => setAccessibilityPanelOpen(false)} 
      />
    </div>
  );
}