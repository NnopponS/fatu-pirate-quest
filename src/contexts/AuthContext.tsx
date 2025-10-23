import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ParticipantAuth {
  role: 'participant';
  participantId: string;
  username: string;
  displayName: string;
}

interface AdminAuth {
  role: 'admin';
  token: string;
  username: string;
}

type AuthState = ParticipantAuth | AdminAuth | null;

interface AuthContextType {
  auth: AuthState;
  isLoading: boolean;
  login: (authData: ParticipantAuth | AdminAuth) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isParticipant: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthFromStorage = () => {
      try {
        const authRole = localStorage.getItem('authRole');
        
        if (authRole === 'participant') {
          const participantId = localStorage.getItem('participantId');
          const username = localStorage.getItem('participantUsername');
          const displayName = localStorage.getItem('participantDisplayName');
          
          if (participantId && username && displayName) {
            setAuth({
              role: 'participant',
              participantId,
              username,
              displayName,
            });
          }
        } else if (authRole === 'admin') {
          const token = localStorage.getItem('adminToken');
          const username = localStorage.getItem('adminUsername');
          
          if (token && username) {
            setAuth({
              role: 'admin',
              token,
              username,
            });
          }
        }
      } catch (error) {
        console.error('Error loading auth from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthFromStorage();
  }, []);

  const login = (authData: ParticipantAuth | AdminAuth) => {
    setAuth(authData);
    
    if (authData.role === 'participant') {
      localStorage.setItem('participantId', authData.participantId);
      localStorage.setItem('participantUsername', authData.username);
      localStorage.setItem('participantDisplayName', authData.displayName);
      localStorage.setItem('authRole', 'participant');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
    } else {
      localStorage.setItem('adminToken', authData.token);
      localStorage.setItem('adminUsername', authData.username);
      localStorage.setItem('authRole', 'admin');
      localStorage.removeItem('participantId');
      localStorage.removeItem('participantUsername');
      localStorage.removeItem('participantDisplayName');
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem('participantId');
    localStorage.removeItem('participantUsername');
    localStorage.removeItem('participantDisplayName');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('authRole');
  };

  const value: AuthContextType = {
    auth,
    isLoading,
    login,
    logout,
    isAuthenticated: auth !== null,
    isParticipant: auth?.role === 'participant',
    isAdmin: auth?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

