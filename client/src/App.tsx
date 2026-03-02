import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import LabResults from "@/pages/LabResults";
import Prescriptions from "@/pages/Prescriptions";
import Requests from "@/pages/Requests";
import Patients from "@/pages/Patients";
import { LoadingScreen } from "@/components/ui-elements";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // If authenticated but no profile, force onboarding unless already on it
  if (!profile) {
    return <Onboarding />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: profile } = useProfile();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (isAuthenticated && !profile) {
    return <Onboarding />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/appointments" component={() => <ProtectedRoute component={Appointments} />} />
      <Route path="/lab-results" component={() => <ProtectedRoute component={LabResults} />} />
      <Route path="/prescriptions" component={() => <ProtectedRoute component={Prescriptions} />} />
      <Route path="/requests" component={() => <ProtectedRoute component={Requests} />} />
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
