import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireParticipant?: boolean;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireParticipant = false, 
  requireAdmin = false 
}: ProtectedRouteProps) => {
  const { isLoading, isAuthenticated, isParticipant, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireParticipant && !isParticipant) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};

