import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Megaphone, ShoppingCart, LogOut, ChevronDown, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const { permissions, logout, currentUser } = useAuth();
  const [kolExpanded, setKolExpanded] = useState(false);

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      borderRight: '1px solid var(--border-color)',
      backgroundColor: 'var(--surface-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '0 12px 24px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)' }}>KLN Superapp</h2>
        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Logged in as: <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', marginLeft: '4px' }}>{currentUser?.name}</span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <NavLink to="/" end className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Landing Page
        </NavLink>

        {permissions.canViewKOL && (
          <div 
            className="sidebar-group" 
            onMouseEnter={() => setKolExpanded(true)}
            onMouseLeave={() => setKolExpanded(false)}
          >
            <div className="sidebar-link group-header" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={20} /> KOL Module
              </div>
              {kolExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            
            {kolExpanded && (
              <div className="sidebar-submenus animate-fade-in" style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <NavLink to="/kol/overview" className={({isActive}) => `sidebar-sublink ${isActive ? 'active' : ''}`}>Overview</NavLink>
                <NavLink to="/kol/dealing" className={({isActive}) => `sidebar-sublink ${isActive ? 'active' : ''}`}>Dealing</NavLink>
                <NavLink to="/kol/scheduling" className={({isActive}) => `sidebar-sublink ${isActive ? 'active' : ''}`}>Scheduling</NavLink>
              </div>
            )}
          </div>
        )}

        {permissions.canViewAds && (
          <NavLink to="/ads" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Megaphone size={20} /> Ads Module
          </NavLink>
        )}

        {permissions.canViewEcomm && (
          <NavLink to="/ecomm" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={20} /> Ecomm Module
          </NavLink>
        )}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        {permissions.canViewManagement && (
          <NavLink to="/management" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary-color)' }}>
            <Users size={20} /> Manage
          </NavLink>
        )}
        <button onClick={logout} className="sidebar-link" style={{ color: 'var(--danger-color)' }}>
          <LogOut size={20} /> Logout
        </button>
      </div>

      <style>{`
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          transition: var(--transition);
          width: 100%;
          text-align: left;
        }
        .sidebar-link:hover {
          background-color: var(--bg-color);
          color: var(--text-primary);
        }
        .sidebar-link.active {
          background-color: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
        }
        .sidebar-sublink {
          display: block;
          padding: 8px 12px;
          font-size: 0.875rem;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          transition: var(--transition);
        }
        .sidebar-sublink:hover {
          color: var(--text-primary);
        }
        .sidebar-sublink.active {
          color: var(--primary-color);
          font-weight: 500;
        }
        .sidebar-sublink.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
