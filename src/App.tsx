import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Lessons from "./pages/Lessons";
import Quiz from "./pages/Quiz";
import Dashboard from "./pages/Dashboard";
import AILearning from "./pages/AILearning";
import About from "./pages/About";
import Auth from "./pages/Auth";
import FAQ from "./pages/FAQ";
import AccountSettings from "./pages/AccountSettings";
import StudentProfilePage from "./pages/StudentProfilePage";
import Subjects from "./pages/Subjects";
import { StudentProfileProvider } from '@/contexts/StudentProfileContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Default to only one retry
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthReady } = useAuth();
  
  if (!isAuthReady || loading) {
    // Show loading spinner while auth is initializing
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Parent only route component
const ParentOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthReady, userRole } = useAuth();
  
  if (!isAuthReady || loading) {
    // Show loading spinner while auth is initializing
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect students to their profile page
  if (userRole === 'student') {
    return <Navigate to="/student-profile" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StudentProfileProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/dashboard" element={
              <ParentOnlyRoute>
                <Dashboard />
              </ParentOnlyRoute>
            } />
            <Route path="/student-profile" element={
              <ProtectedRoute>
                <StudentProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/ai-learning" element={<AILearning />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/account-settings" element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StudentProfileProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
