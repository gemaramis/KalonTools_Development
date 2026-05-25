import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { roles } from '../data/mockData';
import { Shield, ChevronRight } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(roles[0].id);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'kln333315') {
      login(selectedRole);
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--bg-color) 0%, #e2e8f0 100%)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div className="flex-center" style={{ marginBottom: '24px', flexDirection: 'column' }}>
          <div style={{ background: 'var(--primary-color)', color: 'white', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
            <Shield size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>KLN Superapp</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px' }}>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Select Role</label>
            <select 
              className="input-field" 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
            <input 
              type="password"
              className="input-field" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '-10px' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Access Portal <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
