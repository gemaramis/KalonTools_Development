import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import PortalLayout from './components/Layout/PortalLayout';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Ads from './pages/Ads';
import Ecomm from './pages/Ecomm';
import KOLOverview from './pages/KOL/Overview';
import KOLDealing from './pages/KOL/Dealing';
import KOLScheduling from './pages/KOL/Scheduling';
import ManagementHub from './pages/Management/Index';
import KOLTargets from './pages/Management/KOLTargets';
import PersonalReport from './pages/Management/PersonalReport';
import KOLSync from './pages/Management/KOLSync';
import EcommSync from './pages/Management/EcommSync';
import Reporting from './pages/Reporting/index';
import Changelog from './pages/Changelog';
import { SettingsProvider } from './context/SettingsContext';

const ProtectedRoute = ({ children, checkPermission }) => {
  const { currentUser, permissions } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" replace />;
  if (checkPermission && !checkPermission(permissions)) return <Navigate to="/" replace />;
  
  return children;
};

const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/" element={<PortalLayout />}>
        <Route index element={<Landing />} />
      </Route>
      
      <Route path="/" element={<MainLayout />}>
        {/* KOL Routes */}
        <Route path="kol/overview" element={
          <ProtectedRoute checkPermission={(p) => p.canViewKOL}>
            <KOLOverview />
          </ProtectedRoute>
        } />
        <Route path="kol/dealing" element={
          <ProtectedRoute checkPermission={(p) => p.canViewKOL}>
            <KOLDealing />
          </ProtectedRoute>
        } />
        <Route path="kol/scheduling" element={
          <ProtectedRoute checkPermission={(p) => p.canViewKOL}>
            <KOLScheduling />
          </ProtectedRoute>
        } />

        {/* Management Routes */}
        <Route path="management" element={
          <ProtectedRoute checkPermission={(p) => p.canViewManagement}>
            <ManagementHub />
          </ProtectedRoute>
        } />
        <Route path="management/kol-targets" element={
          <ProtectedRoute checkPermission={(p) => p.canViewManagement}>
            <KOLTargets />
          </ProtectedRoute>
        } />
        <Route path="management/personal-report" element={
          <ProtectedRoute checkPermission={(p) => p.canViewKOL}>
            <PersonalReport />
          </ProtectedRoute>
        } />
        <Route path="management/kol-sync" element={
          <ProtectedRoute checkPermission={(p) => p.canViewManagement || p.canViewKOL}>
            <KOLSync />
          </ProtectedRoute>
        } />
        <Route path="management/ecomm-sync" element={
          <ProtectedRoute checkPermission={(p) => p.canViewManagement || p.canViewEcomm}>
            <EcommSync />
          </ProtectedRoute>
        } />
        
        {/* Reporting Route */}
        <Route path="reporting" element={
          <ProtectedRoute>
            <Reporting />
          </ProtectedRoute>
        } />
        
        {/* Ads Route */}
        <Route path="ads" element={
          <ProtectedRoute checkPermission={(p) => p.canViewAds}>
            <Ads />
          </ProtectedRoute>
        } />
        
        {/* Ecomm Route */}
        <Route path="ecomm" element={
          <ProtectedRoute checkPermission={(p) => p.canViewEcomm}>
            <Ecomm />
          </ProtectedRoute>
        } />

        {/* Changelog Route */}
        <Route path="changelog" element={<Changelog />} />
        
        {/* Catch-all route to prevent blank screens */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
