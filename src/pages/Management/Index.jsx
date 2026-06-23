import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Target, Link2, Users } from 'lucide-react';

const ManagementHub = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = currentUser?.id === 'superadmin';
  const isManagement = currentUser?.id === 'management' || isSuperAdmin;
  const isKol = currentUser?.id === 'kol';
  const isEcomm = currentUser?.id === 'ecomm';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>Management Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Select a category to manage settings and syncs.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {isManagement && (
          <button className="bento-card" onClick={() => navigate('/management/kol-targets')} style={{ width: '280px', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ background: '#e4edce', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#5b6b3a' }}>
              <Target size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>KOL Targets</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Set operations targets, budget, and PIC distribution.</p>
          </button>
        )}

        {isKol && (
          <button className="bento-card" onClick={() => navigate('/management/personal-report')} style={{ width: '280px', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ background: '#e4edce', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#5b6b3a' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Personal Report</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>View your targets, completed deals, and remaining goals.</p>
          </button>
        )}

        {(isSuperAdmin || (isKol && !isManagement)) && (
          <button className="bento-card" onClick={() => navigate('/management/kol-sync')} style={{ width: '280px', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ background: '#e4edce', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#5b6b3a' }}>
              <Link2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>KOL Spreadsheet Sync</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage dealing and scheduling spreadsheet links.</p>
          </button>
        )}

        {(isSuperAdmin || isEcomm) && (
          <button className="bento-card" onClick={() => navigate('/management/ecomm-sync')} style={{ width: '280px', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ background: '#e4edce', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#5b6b3a' }}>
              <Link2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Ecommerce Sync</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage Ecommerce, Finance, Ads, and Distribution links.</p>
          </button>
        )}
      </div>
    </div>
  );
};

export default ManagementHub;
