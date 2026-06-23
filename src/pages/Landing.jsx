import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEcommerceData } from '../hooks/useEcommerceData';
import { kolMockData } from '../data/mockData';
import { Users, Megaphone, ShoppingCart, LayoutDashboard, ArrowUpRight, CheckCircle2, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

const Landing = () => {
  const { permissions } = useAuth();
  const navigate = useNavigate();
  
  const { data: ecommData } = useEcommerceData();

  // Mock processing for previews
  const totalDeals = kolMockData.filter(d => d.dealingStatus === 'Deal' || d.dealingStatus === 'Dealed').length;
  const ecommTotalGmv = ecommData ? ecommData.reduce((sum, row) => sum + (parseInt(row['GMV']?.toString().replace(/[^0-9]/g, '')) || 0), 0) : 0;
  
  const miniChartData = [
    { value: 20 }, { value: 35 }, { value: 25 }, { value: 50 }, { value: 45 }, { value: 65 }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60vh', paddingBottom: '60px' }}>
      
      {/* Pill Navigation Header */}
      <div className="pill-nav">
        <button className="pill-nav-item active">Hub Overview</button>
        {permissions.canViewManagement && (
          <button className="pill-nav-item" onClick={() => navigate('/management')}>System Settings</button>
        )}
        <button className="pill-nav-item" onClick={() => navigate('/changelog')}>
          Release Notes <ArrowUpRight size={14} style={{ display: 'inline', marginLeft: '4px' }}/>
        </button>
      </div>

      <div className="complex-bento-grid">
        
        {/* Large Dark Card - Reporting Overview */}
        <button 
          className="complex-bento-card bento-span-2-col bento-span-2-row dark-bento"
          onClick={() => navigate('/reporting')}
          style={{ justifyContent: 'space-between', padding: '32px' }}
        >
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(192, 210, 154, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div>
            <h1 className="hero-title" style={{ fontWeight: '700', lineHeight: 1.1, marginBottom: '24px' }}>
              Comprehensive<br/>Report —
            </h1>
            <div className="pill-nav-item" style={{ border: '1px solid #334155', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Check full details <ArrowUpRight size={14} />
            </div>
          </div>
          
          <div className="flex-between text-muted" style={{ borderTop: '1px solid #334155', paddingTop: '16px', fontSize: '0.875rem' }}>
            <span><Activity size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> System Health: Excellent</span>
            <span>Real-time Data Active</span>
          </div>
        </button>

        {/* Medium Card - KOL */}
        {permissions.canViewKOL && (
          <button 
            className="complex-bento-card bento-span-2-col"
            onClick={() => navigate('/kol/overview')}
            style={{ background: 'var(--primary-color)', color: 'var(--text-primary)' }}
          >
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <div className="pill-nav-item" style={{ background: 'rgba(255,255,255,0.4)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.1)' }}>
                KOL MODULE
              </div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={16} />
              </div>
            </div>
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Social Campaigns</h3>
            <p style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.6)', marginBottom: 'auto' }}>Manage Key Opinion Leaders and track deals.</p>
            
            <div className="flex-between" style={{ alignItems: 'flex-end', marginTop: '24px' }}>
              <div>
                <span style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 }}>{totalDeals}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', marginLeft: '8px' }}>Deals</span>
              </div>
              <div style={{ width: '100px', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '75%', background: 'var(--text-primary)', borderRadius: '2px' }} />
              </div>
            </div>
          </button>
        )}

        {/* Medium Light Card - Ecommerce */}
        {permissions.canViewEcomm && (
          <button 
            className="complex-bento-card bento-span-2-col"
            onClick={() => navigate('/ecomm')}
          >
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <div className="pill-nav-item" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                SELLER CENTER
              </div>
              <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Rp {(ecommTotalGmv/1000000).toFixed(1)} M</span>
            </div>
            
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success-color)' }}>+24.8%</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>GMV increase in the last month.</p>
            
            <div style={{ height: '40px', width: '100%', marginTop: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={miniChartData}>
                  <Bar dataKey="value" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </button>
        )}

        {/* Large Horizontal Card - Ads */}
        {permissions.canViewAds && (
          <button 
            className="complex-bento-card bento-span-2-col"
            onClick={() => navigate('/ads')}
            style={{ justifyContent: 'space-between' }}
          >
             <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div className="pill-nav-item" style={{ border: '1px solid var(--border-color)' }}>
                ADS MANAGEMENT
              </div>
              <Megaphone size={20} color="var(--text-secondary)" />
            </div>
            
            <h3 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '16px' }}>Advertising</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Total Budget</span>
              <span style={{ color: 'var(--text-secondary)' }}>Target Active</span>
            </div>
            <div style={{ height: '8px', width: '100%', background: 'var(--bg-color)', borderRadius: '4px', marginBottom: '12px', position: 'relative' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '45%', background: 'var(--text-primary)', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Budget Spent</span>
              <span style={{ color: 'var(--text-secondary)' }}>85% utilization</span>
            </div>
            <div style={{ height: '8px', width: '80%', background: 'var(--bg-color)', borderRadius: '4px', marginBottom: '24px', position: 'relative' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '85%', background: 'var(--primary-color)', borderRadius: '4px' }} />
            </div>
            
            <div className="flex-between" style={{ alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>Monitor spend and optimize platform performance.</p>
              <div className="pill-nav-item" style={{ border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Check details <ArrowUpRight size={14} />
              </div>
            </div>
          </button>
        )}

        {/* Small Bottom Card - Management Hub */}
        {permissions.canViewManagement && (
          <button 
            className="complex-bento-card"
            onClick={() => navigate('/management')}
            style={{ background: '#f8fafc', border: '1px solid var(--primary-color)' }}
          >
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <div className="pill-nav-item" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>
                MANAGEMENT
              </div>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={12} />
              </div>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Settings</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: 'auto' }}>System Config</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '24px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>System Health</span>
              <span style={{ color: 'var(--text-secondary)' }}>100% Good</span>
            </div>
            <div style={{ height: '4px', width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: '100%', background: 'var(--primary-color)', borderRadius: '2px' }} />
            </div>
          </button>
        )}

        {/* Small Bottom Card - Sync */}
        {(permissions.canViewManagement || permissions.canViewEcomm || permissions.canViewKOL) && (
          <button 
            className="complex-bento-card"
            onClick={() => navigate('/management/kol-sync')}
            style={{ background: '#f8fafc' }}
          >
             <div className="flex-between" style={{ marginBottom: '24px' }}>
              <div className="pill-nav-item" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>
                SPREADSHEETS
              </div>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={12} />
              </div>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Integrations</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: 'auto' }}>Data Sync</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '24px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Sync Status</span>
              <span style={{ color: 'var(--text-secondary)' }}>82% Synced</span>
            </div>
            <div style={{ height: '4px', width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: '82%', background: 'var(--text-primary)', borderRadius: '2px' }} />
            </div>
          </button>
        )}

      </div>
    </div>
  );
};

export default Landing;
