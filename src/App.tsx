import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";

// Eager load: Homepage & Auth (needed immediately)
import Index from "./pages/Index";
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

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
    <div className="text-center space-y-4">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto" />
      <p className="text-xl text-white font-semibold">กำลังโหลด...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Eager loaded routes - Homepage & Auth */}
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              
              {/* Lazy loaded routes - User pages */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requireParticipant>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/map" 
                element={
                  <ProtectedRoute requireParticipant>
                    <Map />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checkin" 
                element={
                  <ProtectedRoute requireParticipant>
                    <Checkin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rewards" 
                element={
                  <ProtectedRoute requireParticipant>
                    <Rewards />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute requireParticipant>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/game" 
                element={<FlappyBird />} 
              />
              
              {/* Lazy loaded routes - Admin pages */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/prize-verification" 
                element={
                  <ProtectedRoute requireAdmin>
                    <PrizeVerification />
                  </ProtectedRoute>
                } 
              />
              
              {/* Error page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
