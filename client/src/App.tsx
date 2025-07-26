import React from 'react';
import { Switch, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from './lib/queryClient';

// Pages
import Landing from '@/pages/landing';
import Login from '@/pages/login';
import Home from '@/pages/home';
import AdminDashboard from '@/pages/admin-dashboard';
import BrokerDashboard from '@/pages/broker-dashboard';
import CreateListing from '@/pages/create-listing';
import PropertyDetails from '@/pages/property-details';
import RoleSelection from '@/pages/role-selection';
import NotFound from '@/pages/not-found';

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const needsRoleSelection =
    isAuthenticated &&
    user &&
    (!user.role || !user.phoneNumber || (user.role === 'broker' && !user.reraId));

  if (isLoading) {
    return <div>Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route> <NotFound /> </Route>
      </Switch>
    );
  }

  if (needsRoleSelection) {
    return <RoleSelection />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/broker" component={BrokerDashboard} />
      <Route path="/create-listing" component={CreateListing} />
      <Route path="/property/:id">
        {({ id }) => <PropertyDetails id={id} />}
      </Route>
      <Route> <NotFound /> </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <TooltipProvider>
          {/* Skip link for accessibility */}
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
}
