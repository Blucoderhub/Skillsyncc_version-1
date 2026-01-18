import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { Footer } from "@/components/Footer";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Quests from "@/pages/Quests";
import ProblemDetail from "@/pages/ProblemDetail";
import Hackathons from "@/pages/Hackathons";
import Practice from "@/pages/IDE";
import Tutorials from "@/pages/Tutorials";
import TutorialDetail from "@/pages/TutorialDetail";
import Discussions from "@/pages/Discussions";
import DiscussionDetail from "@/pages/DiscussionDetail";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary rounded-full border-t-transparent animate-spin"></div></div>;
  
  if (!user) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow pt-4 pb-8">
        <Component />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

// Public Route Wrapper (redirects to dashboard if logged in)
function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user) return <Redirect to="/dashboard" />;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PublicRoute component={Landing} />
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>

      <Route path="/quests">
        <ProtectedRoute component={Quests} />
      </Route>

      <Route path="/quests/:slug">
        <ProtectedRoute component={ProblemDetail} />
      </Route>

      <Route path="/hackathons">
        <ProtectedRoute component={Hackathons} />
      </Route>

      <Route path="/practice">
        <ProtectedRoute component={Practice} />
      </Route>

      <Route path="/ide">
        <Redirect to="/practice" />
      </Route>

      <Route path="/tutorials">
        <ProtectedRoute component={Tutorials} />
      </Route>

      <Route path="/tutorials/:slug">
        <ProtectedRoute component={TutorialDetail} />
      </Route>

      <Route path="/discussions">
        <ProtectedRoute component={Discussions} />
      </Route>

      <Route path="/discussions/:id">
        <ProtectedRoute component={DiscussionDetail} />
      </Route>

      <Route path="/leaderboard">
        <ProtectedRoute component={Leaderboard} />
      </Route>

      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
