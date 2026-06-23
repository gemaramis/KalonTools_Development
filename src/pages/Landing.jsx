import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Megaphone, ShoppingCart, LayoutDashboard, FileBarChart } from 'lucide-react';

const Landing = () => {
  const { permissions } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '48px', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Select Module</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Choose a module below to access your dashboard. Your available modules are based on your role permissions.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', maxWidth: '1600px' }}>
        {permissions.canViewKOL && (
          <button className="bento-card" onClick={() => navigate('/kol/overview')} style={{ textAlign: 'left', cursor: 'pointer', width: '280px', background: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ background: '#e4edce', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#5b6b3a' }}>
              <Users size={32} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>KOL Module</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', flex: 1 }}>Manage Key Opinion Leaders, overview metrics, deal structuring, and schedule tracking.</p>
            <div style={{ marginTop: '24px', fontWeight: '600', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Open Module &rarr;
            </div>
          </button>
        )}

        {permissions.canViewAds && (
          <button className="bento-card" onClick={() => navigate('/ads')} style={{ textAlign: 'left', cursor: 'pointer', width: '280px', background: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ background: '#e4edce', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#5b6b3a' }}>
              <Megaphone size={32} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>Ads Management</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', flex: 1 }}>Track advertising campaigns, monitor spend, and optimize performance across platforms.</p>
            <div style={{ marginTop: '24px', fontWeight: '600', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Open Module &rarr;
            </div>
          </button>
        )}

        {permissions.canViewEcomm && (
          <button className="bento-card" onClick={() => navigate('/ecomm')} style={{ textAlign: 'left', cursor: 'pointer', width: '280px', background: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ background: '#e4edce', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#5b6b3a' }}>
              <ShoppingCart size={32} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>Seller Center</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', flex: 1 }}>Manage e-commerce operations, TikTok shop integration, and sales data.</p>
            <div style={{ marginTop: '24px', fontWeight: '600', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Open Module &rarr;
            </div>
          </button>
        )}

        {permissions.canViewManagement && (
          <button className="bento-card" onClick={() => navigate('/management')} style={{ textAlign: 'left', cursor: 'pointer', width: '280px', background: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ background: '#e4edce', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#5b6b3a' }}>
              <LayoutDashboard size={32} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>Management</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', flex: 1 }}>System configuration, target settings, and spreadsheet sync options.</p>
            <div style={{ marginTop: '24px', fontWeight: '600', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Open Module &rarr;
            </div>
          </button>
        )}

        <button className="bento-card" onClick={() => navigate('/reporting')} style={{ textAlign: 'left', cursor: 'pointer', width: '280px', background: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{ background: '#e4edce', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#5b6b3a' }}>
            <FileBarChart size={32} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>Reporting</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', flex: 1 }}>Comprehensive aggregate reporting across KOL, Ads, and Ecommerce.</p>
          <div style={{ marginTop: '24px', fontWeight: '600', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Open Module &rarr;
          </div>
        </button>

      </div>
    </div>
  );
};

export default Landing;
