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
import ManageStudentProfilesPage from "./pages/ManageStudentProfilesPage";
import Subjects from "./pages/Subjects";
import { StudentProfileProvider } from '@/contexts/StudentProfileContext';
import DetailedQuizHistoryPage from "./pages/DetailedQuizHistory";
import ErrorBoundary from "@/components/ErrorBoundary";
import { fixStudentProfilesMappings } from "@/utils/databaseMigration";
import { useEffect } from "react";

// Create QueryClient with updated configuration (removed onError)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthReady } = useAuth();
  
  useEffect(() => {
    // Run database migrations when auth is ready
    if (isAuthReady && user) {
      fixStudentProfilesMappings();
    }
  }, [isAuthReady, user]);
  
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
  
  return <ErrorBoundary fallback={
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-2xl font-bold text-red-600">Page Error</h2>
      <p className="mb-4">We encountered an issue loading this page.</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="rounded bg-eduPurple px-4 py-2 text-white hover:bg-eduPurple/80"
      >
        Go to Home
      </button>
    </div>
  }>{children}</ErrorBoundary>;
};

// Parent only route component
const ParentOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthReady, userRole } = useAuth();
  
  useEffect(() => {
    // Run database migrations when auth is ready
    if (isAuthReady && user) {
      fixStudentProfilesMappings();
    }
  }, [isAuthReady, user]);
  
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
  
  return <ErrorBoundary fallback={
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-2xl font-bold text-red-600">Page Error</h2>
      <p className="mb-4">We encountered an issue loading this page.</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="rounded bg-eduPurple px-4 py-2 text-white hover:bg-eduPurple/80"
      >
        Go to Home
      </button>
    </div>
  }>{children}</ErrorBoundary>;
};

const App = () => {
  // Run database migrations on app start
  useEffect(() => {
    const runMigrations = async () => {
      try {
        await fixStudentProfilesMappings();
      } catch (error) {
        console.error("Error running database migrations:", error);
      }
    };
    
    runMigrations();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StudentProfileProvider>
          <ErrorBoundary fallback={ 
            <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
              <h2 className="mb-4 text-2xl font-bold text-red-600">Application Error</h2>
              <p className="mb-4">Sorry, something went wrong with the application.</p>
              <button 
                onClick={() => window.location.reload()}
                className="rounded bg-eduPurple px-4 py-2 text-white hover:bg-eduPurple/80"
              >
                Refresh Page
              </button>
            </div>
          }>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/lessons" element={
                  <ErrorBoundary fallback={
                    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                      <h2 className="mb-4 text-2xl font-bold text-red-600">Lessons Error</h2>
                      <p className="mb-4">We encountered an issue loading the lessons.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="rounded bg-eduPurple px-4 py-2 text-white hover:bg-eduPurple/80"
                      >
                        Try Again
                      </button>
                    </div>
                  }>
                    <Lessons />
                  </ErrorBoundary>
                } />
                <Route path="/subjects" element={
                  <ErrorBoundary fallback={
                    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                      <h2 className="mb-4 text-2xl font-bold text-red-600">Subjects Error</h2>
                      <p className="mb-4">We encountered an issue loading the subjects.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="rounded bg-eduPurple px-4 py-2 text-white hover:bg-eduPurple/80"
                      >
                        Try Again
                      </button>
                    </div>
                  }>
                    <Subjects />
                  </ErrorBoundary>
                } />
                <Route path="/quiz" element={
                  <ErrorBoundary fallback={
                    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                      <h2 className="mb-4 text-2xl font-bold text-red-600">Quiz Error</h2>
                      <p className="mb-4">We encountered an issue loading the quiz.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="rounded bg-eduPurple px-4 py-2 text-white hover:bg-eduPurple/80"
                      >
                        Try Again
                      </button>
                    </div>
                  }>
                    <Quiz />
                  </ErrorBoundary>
                } />
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
                <Route path="/ai-learning" element={
                  <ErrorBoundary fallback={
                    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                      <h2 className="mb-4 text-2xl font-bold text-red-600">AI Learning Error</h2>
                      <p className="mb-4">We encountered an issue loading the AI learning content.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="rounded bg-eduPurple px-4 py-2 text-white hover:bg-eduPurple/80"
                      >
                        Try Again
                      </button>
                    </div>
                  }>
                    <AILearning />
                  </ErrorBoundary>
                } />
                <Route path="/ai-lesson" element={
                  <ErrorBoundary fallback={
                    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                      <h2 className="mb-4 text-2xl font-bold text-red-600">AI Lesson Error</h2>
                      <p className="mb-4">We encountered an issue loading the AI lesson content.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="rounded bg-eduPurple px-4 py-2 text-white hover:bg-eduPurple/80"
                      >
                        Try Again
                      </button>
                    </div>
                  }>
                    <AILesson />
                  </ErrorBoundary>
                } />
                <Route path="/about" element={<About />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/account-settings" element={
                  <ProtectedRoute>
                    <AccountSettings />
                  </ProtectedRoute>
                } />
                <Route path="/student/:studentId/quiz-history/:topicId" element={
                  <ProtectedRoute>
                    <DetailedQuizHistoryPage />
                  </ProtectedRoute>
                } />
                <Route path="/manage-student-profiles" element={
                  <ProtectedRoute>
                    <ManageStudentProfilesPage />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </StudentProfileProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
