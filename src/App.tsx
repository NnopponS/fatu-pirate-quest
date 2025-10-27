import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Map from "./pages/Map";
import Checkin from "./pages/Checkin";
import Rewards from "./pages/Rewards";
import Profile from "./pages/Profile";
import FlappyBird from "./pages/FlappyBird";
import AdminDashboard from "./pages/AdminDashboard";
import PrizeVerification from "./pages/PrizeVerification";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
