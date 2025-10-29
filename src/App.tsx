import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { PageTransition, PageLoader } from "./components/PageTransition";

// Eager load: Homepage & Auth (needed immediately)
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

// Lazy load: User pages (loaded only when needed)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Map = lazy(() => import("./pages/Map"));
const Checkin = lazy(() => import("./pages/Checkin"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Profile = lazy(() => import("./pages/Profile"));
const FlappyBird = lazy(() => import("./pages/FlappyBird"));

// Lazy load: Admin pages (rarely used, load on demand)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PrizeVerification = lazy(() => import("./pages/PrizeVerification"));

// Lazy load: Error page
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Animated Routes wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="sync" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Eager loaded routes - Homepage & Auth */}
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        
        {/* Lazy loaded routes - User pages */}
        <Route 
          path="/dashboard" 
          element={
            <PageTransition>
              <ProtectedRoute requireParticipant>
                <Dashboard />
              </ProtectedRoute>
            </PageTransition>
          } 
        />
        <Route 
          path="/map" 
          element={
            <PageTransition>
              <ProtectedRoute requireParticipant>
                <Map />
              </ProtectedRoute>
            </PageTransition>
          } 
        />
        <Route 
          path="/checkin" 
          element={
            <PageTransition>
              <ProtectedRoute requireParticipant>
                <Checkin />
              </ProtectedRoute>
            </PageTransition>
          } 
        />
        <Route 
          path="/rewards" 
          element={
            <PageTransition>
              <ProtectedRoute requireParticipant>
                <Rewards />
              </ProtectedRoute>
            </PageTransition>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <PageTransition>
              <ProtectedRoute requireParticipant>
                <Profile />
              </ProtectedRoute>
            </PageTransition>
          } 
        />
        <Route 
          path="/game" 
          element={<PageTransition><FlappyBird /></PageTransition>} 
        />
        
        {/* Lazy loaded routes - Admin pages */}
        <Route 
          path="/admin" 
          element={
            <PageTransition>
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            </PageTransition>
          } 
        />
        <Route 
          path="/prize-verification" 
          element={
            <PageTransition>
              <ProtectedRoute requireAdmin>
                <PrizeVerification />
              </ProtectedRoute>
            </PageTransition>
          } 
        />
        
        {/* Error page */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
