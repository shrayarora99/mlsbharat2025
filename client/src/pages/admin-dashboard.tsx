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
import { Clock, CheckCircle, XCircle, Star, Home, LogOut, Settings, AlertTriangle, Eye, Calendar, Accessibility } from "lucide-react";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { useState } from "react";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);

  const { data: properties = [], isLoading: propertiesLoading, error } = useQuery<PropertyWithOwnerAndImages[]>({
    queryKey: ["/api/admin/properties"],
    retry: false,
  });

  const { data: pendingProperties = [] } = useQuery<PropertyWithOwnerAndImages[]>({
    queryKey: ["/api/admin/properties/pending"],
    retry: false,
  });

  const { data: pendingBrokers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/brokers/pending"],
    retry: false,
  });

  const { data: duplicateListings = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/duplicates"],
    retry: false,
  });

  const { data: propertiesNeedingReview = [] } = useQuery<PropertyWithOwnerAndImages[]>({
    queryKey: ["/api/admin/properties/review"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (!user || (user as any).role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required.",
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
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [error, toast]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, isVerified }: { id: number; status: string; isVerified?: boolean }) => {
      await apiRequest("PATCH", `/api/admin/properties/${id}/status`, { status, isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/pending"] });
      toast({
        title: "Success",
        description: "Property status updated successfully.",
      });
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

  const handleApprove = (id: number) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  const handleVerify = (id: number) => {
    updateStatusMutation.mutate({ id, status: "approved", isVerified: true });
  };

  const brokerVerificationMutation = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      await apiRequest("PATCH", `/api/admin/brokers/${id}/verify`, { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers/pending"] });
      toast({
        title: "Success",
        description: "Broker verification status updated successfully.",
      });
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
        description: "Failed to update broker verification status.",
        variant: "destructive",
      });
    },
  });

  const handleBrokerApprove = (id: string) => {
    brokerVerificationMutation.mutate({ id, isVerified: true });
  };

  const handleBrokerReject = (id: string) => {
    brokerVerificationMutation.mutate({ id, isVerified: false });
  };

  const duplicateReviewMutation = useMutation({
    mutationFn: async (duplicateId: number) => {
      await apiRequest("PATCH", `/api/admin/duplicates/${duplicateId}/review`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duplicates"] });
      toast({
        title: "Success",
        description: "Duplicate listing marked as reviewed.",
      });
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
        description: "Failed to mark duplicate as reviewed.",
        variant: "destructive",
      });
    },
  });

  const handleDuplicateReview = (duplicateId: number) => {
    duplicateReviewMutation.mutate(duplicateId);
  };

  const handleLogout = () => {
    import("@/lib/authHelpers").then(({ handleLogout }) => handleLogout());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || (user as any).role !== 'admin') {
    return null;
  }

  const approvedProperties = properties.filter(p => p.status === 'approved');
  const rejectedProperties = properties.filter(p => p.status === 'rejected');
  const verifiedProperties = properties.filter(p => p.isVerified);

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
                <span className="text-primary px-3 py-2 text-sm font-medium">Admin Dashboard</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Admin</span>
              <Badge variant="secondary">admin</Badge>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
            <Card className="card-mlsbharat">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-blue-600">{pendingProperties.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-mlsbharat">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{approvedProperties.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-mlsbharat">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{rejectedProperties.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-mlsbharat">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Star className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Verified</p>
                    <p className="text-2xl font-bold text-purple-600">{verifiedProperties.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-mlsbharat">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Brokers</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingBrokers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-mlsbharat">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Duplicates</p>
                    <p className="text-2xl font-bold text-red-600">{duplicateListings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-mlsbharat">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Need Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{propertiesNeedingReview.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Broker Verification Section */}
        {pendingBrokers.length > 0 && (
          <Card className="card-mlsbharat mb-8">
            <CardHeader>
              <CardTitle>Pending Broker Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broker</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RERA ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingBrokers.map((broker) => (
                      <tr key={broker.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {broker.firstName} {broker.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Registered: {new Date(broker.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {broker.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {broker.reraId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {broker.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleBrokerApprove(broker.id)}
                              disabled={brokerVerificationMutation.isPending}
                            >
                              Verify
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleBrokerReject(broker.id)}
                              disabled={brokerVerificationMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Duplicate Listings Section */}
        {duplicateListings.length > 0 && (
          <Card className="card-mlsbharat mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Duplicate Listing Attempts ({duplicateListings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempted Listing</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempted By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Existing Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Existing Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {duplicateListings.map((duplicate) => (
                      <tr key={duplicate.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {duplicate.attemptedTitle}
                          </div>
                          <div className="text-sm text-gray-500">
                            {duplicate.attemptedLocation}
                          </div>
                          <div className="text-xs text-gray-400">
                            Attempted: {new Date(duplicate.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {duplicate.attemptedBy.firstName} {duplicate.attemptedBy.lastName}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {duplicate.attemptedBy.role}
                          </div>
                          <div className="text-xs text-gray-400">
                            {duplicate.attemptedBy.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {duplicate.existingProperty.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {duplicate.existingProperty.location}
                          </div>
                          <div className="text-xs text-gray-400">
                            ₹{duplicate.existingProperty.price}/month
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {duplicate.existingProperty.owner.firstName} {duplicate.existingProperty.owner.lastName}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {duplicate.existingProperty.owner.role}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDuplicateReview(duplicate.id)}
                              disabled={duplicateReviewMutation.isPending}
                            >
                              Mark Reviewed
                            </Button>
                            <Link href={`/property/${duplicate.existingProperty.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="w-3 h-3 mr-1" />
                                View Existing
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties Needing Review Section */}
        {propertiesNeedingReview.length > 0 && (
          <Card className="card-mlsbharat mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-yellow-600" />
                Properties Needing Review ({propertiesNeedingReview.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age (Days)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {propertiesNeedingReview.map((property) => {
                      const daysOld = property.createdAt ? Math.ceil((new Date().getTime() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                      return (
                        <tr key={property.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                {property.images && property.images.length > 0 ? (
                                  <img 
                                    className="h-10 w-10 rounded-lg object-cover" 
                                    src={property.images[0].imageUrl} 
                                    alt={property.title} 
                                  />
                                ) : property.imageUrl ? (
                                  <img 
                                    className="h-10 w-10 rounded-lg object-cover" 
                                    src={property.imageUrl} 
                                    alt={property.title} 
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <Home className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{property.title}</div>
                                <div className="text-sm text-gray-500">{property.location}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{property.owner.firstName} {property.owner.lastName}</div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm text-gray-500 capitalize">{property.owner.role}</div>
                              {property.owner.role === 'broker' && (
                                <VerificationBadge 
                                  isVerified={(property.owner as any).isVerified}
                                  reraId={(property.owner as any).reraId}
                                  size="sm"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={daysOld > 45 ? "destructive" : "secondary"}>
                              {daysOld} days
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              className={
                                property.listingStatus === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : property.listingStatus === 'sold'
                                  ? 'bg-blue-100 text-blue-800'
                                  : property.listingStatus === 'rented'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {property.listingStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link href={`/property/${property.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="w-3 h-3 mr-1" />
                                Review
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties Table */}
        <Card className="card-mlsbharat">
          <CardHeader>
            <CardTitle>All Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {propertiesLoading ? (
              <div className="text-center py-8">Loading properties...</div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No properties found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {properties.map((property) => (
                      <tr key={property.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {property.images && property.images.length > 0 ? (
                                <img 
                                  className="h-10 w-10 rounded-lg object-cover" 
                                  src={property.images[0].imageUrl} 
                                  alt={property.title} 
                                />
                              ) : property.imageUrl ? (
                                <img 
                                  className="h-10 w-10 rounded-lg object-cover" 
                                  src={property.imageUrl} 
                                  alt={property.title} 
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Home className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{property.title}</div>
                              <div className="text-sm text-gray-500">{property.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{property.owner.firstName} {property.owner.lastName}</div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500 capitalize">{property.owner.role}</div>
                            {property.owner.role === 'broker' && (
                              <VerificationBadge 
                                isVerified={(property.owner as any).isVerified}
                                reraId={(property.owner as any).reraId}
                                size="sm"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{property.price}/month</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <Badge 
                              className={
                                property.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : property.status === 'rejected' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {property.status}
                            </Badge>
                            {property.isVerified && (
                              <Badge className="bg-purple-100 text-purple-800">Verified</Badge>
                            )}
                            {property.needsReview && (
                              <Badge variant="destructive">Needs Review</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            className={
                              property.listingStatus === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : property.listingStatus === 'sold'
                                ? 'bg-blue-100 text-blue-800'
                                : property.listingStatus === 'rented'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {property.listingStatus || 'active'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {property.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApprove(property.id)}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleReject(property.id)}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {property.status === 'approved' && !property.isVerified && (
                              <Button 
                                size="sm" 
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => handleVerify(property.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                Mark Verified
                              </Button>
                            )}
                            <Link href={`/property/${property.id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
