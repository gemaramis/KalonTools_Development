import React, { createContext, useContext, useState } from 'react';
import { roles } from '../data/mockData';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  const login = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    setCurrentUser(role);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // RBAC Helpers
  const canViewKOL = currentUser?.id === 'superadmin' || currentUser?.id === 'management' || currentUser?.id === 'kol';
  const canViewAds = currentUser?.id === 'superadmin' || currentUser?.id === 'management' || currentUser?.id === 'ads';
  const canViewEcomm = currentUser?.id === 'superadmin' || currentUser?.id === 'management' || currentUser?.id === 'ecomm';
  
  const canEditApproval = currentUser?.id === 'superadmin' || currentUser?.id === 'management';
  const canEditDealingStatus = currentUser?.id === 'superadmin' || currentUser?.id === 'kol';

  const value = {
    currentUser,
    login,
    logout,
    permissions: {
      canViewKOL,
      canViewAds,
      canViewEcomm,
      canEditApproval,
      canEditDealingStatus
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
