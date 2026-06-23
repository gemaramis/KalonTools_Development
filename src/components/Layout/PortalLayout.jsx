import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PortalLayout = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="moving-gradient-bg" style={{ 
      minHeight: '100vh', 
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{ 
        height: '80px', 
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'transparent'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>KLN Superapp</h1>
        </div>
        <div className="flex-center" style={{ gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Welcome back</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {currentUser.name.charAt(0)}
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.8)' }}>
            Logout
          </button>
        </div>
      </header>
      
      <main style={{ flex: 1, padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;
