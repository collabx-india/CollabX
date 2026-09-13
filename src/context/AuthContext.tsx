import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserPersona } from '../types';
import { storageService } from '../services/storageService';
import { collabxApi } from '../services/collabxApi';

interface AuthContextType {
  currentUser: UserPersona;
  isLoggedIn: boolean;
  isLoading: boolean;
  showLandingPage: boolean;
  setShowLandingPage: (show: boolean) => void;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<UserPersona>(() => storageService.getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(Boolean(storageService.getAuthToken()));
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(storageService.getAuthToken()));
  const [showLandingPage, setShowLandingPage] = useState<boolean>(false);

  const resolveOrganization = (user: { role: string; organization?: string; email?: string }): string => {
    if (user.organization && user.organization.trim() !== '') {
      return user.organization.trim();
    }
    const storedUser = storageService.getCurrentUser();
    if (storedUser && storedUser.role === user.role && storedUser.organization) {
      if (!user.email || !storedUser.email || storedUser.email.toLowerCase() === user.email.toLowerCase()) {
        return storedUser.organization.trim();
      }
    }
    if (user.email) {
      const emailLower = user.email.toLowerCase();
      if (emailLower.includes('bitmesra') || emailLower.includes('@bit')) {
        return 'Birla Institute of Technology (BIT) Mesra';
      }
      if (emailLower.includes('iitism') || emailLower.includes('ism') || emailLower.includes('dhanbad')) {
        return 'IIT (ISM) Dhanbad';
      }
      if (emailLower.includes('nitjsr') || emailLower.includes('nit')) {
        return 'National Institute of Technology (NIT) Jamshedpur';
      }
    }
    return storedUser?.organization?.trim() || '';
  };

  useEffect(() => {
    if (!storageService.getAuthToken()) {
      return;
    }
    void collabxApi.getCurrentUser()
      .then(user => {
        const resolvedOrg = resolveOrganization(user);
        setCurrentUserState(prev => {
          const updated: UserPersona = {
            ...prev,
            ...user,
            subRole: user.role === 'government' ? 'Government Officer' : user.role === 'expert' ? 'Domain Expert' : user.role === 'industry' ? 'Industry Partner' : user.role === 'professor' ? 'Professor' : user.role === 'student' ? 'Student' : 'Citizen',
            title: prev.title || user.role,
            organization: resolvedOrg,
            district: prev.district || 'Jharkhand',
            verified: true,
          };
          storageService.setCurrentUser(updated);
          return updated;
        });
        setIsLoggedIn(true);
      })
      .catch(() => {
        storageService.clearAuth();
        setIsLoggedIn(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleAuthError = () => {
      setIsLoggedIn(false);
      setShowLandingPage(true);
    };
    window.addEventListener('collabx:auth-error', handleAuthError);
    return () => window.removeEventListener('collabx:auth-error', handleAuthError);
  }, []);

  const login = async (token: string) => {
    storageService.setAuthToken(token);
    const user = await collabxApi.getCurrentUser();
    const resolvedOrg = resolveOrganization(user);
    setCurrentUserState(prev => {
      const updated: UserPersona = {
        ...prev,
        ...user,
        subRole: user.role === 'government' ? 'Government Officer' : user.role === 'expert' ? 'Domain Expert' : user.role === 'industry' ? 'Industry Partner' : user.role === 'professor' ? 'Professor' : user.role === 'student' ? 'Student' : 'Citizen',
        title: prev.title || user.role,
        organization: resolvedOrg,
        district: prev.district || 'Jharkhand',
        verified: true,
      };
      storageService.setCurrentUser(updated);
      return updated;
    });
    setIsLoggedIn(true);
    setShowLandingPage(false);
  };

  const logout = () => {
    storageService.clearAuth();
    setIsLoggedIn(false);
    setShowLandingPage(true);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isLoading,
        showLandingPage,
        setShowLandingPage,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
