import React, { createContext, useContext, useState } from 'react';
import { roles } from '../data/mockData';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kln_current_user');
      return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
      return null;
    }
  });

  const login = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    setCurrentUser(role);
    localStorage.setItem('kln_current_user', JSON.stringify(role));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kln_current_user');
  };

  // RBAC Helpers
  const canViewKOL = currentUser?.id === 'superadmin' || currentUser?.id === 'management' || currentUser?.id === 'kol';
  const canViewAds = currentUser?.id === 'superadmin' || currentUser?.id === 'management' || currentUser?.id === 'ads';
  const canViewEcomm = currentUser?.id === 'superadmin' || currentUser?.id === 'management' || currentUser?.id === 'ecomm';
  
  const canEditApproval = currentUser?.id === 'superadmin' || currentUser?.id === 'management';
  const canEditDealingStatus = currentUser?.id === 'superadmin' || currentUser?.id === 'kol';
  const canViewManagement = currentUser?.id === 'superadmin' || currentUser?.id === 'management' || currentUser?.id === 'kol';

  const value = {
    currentUser,
    login,
    logout,
    permissions: {
      canViewKOL,
      canViewAds,
      canViewEcomm,
      canEditApproval,
      canEditDealingStatus,
      canViewManagement
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
