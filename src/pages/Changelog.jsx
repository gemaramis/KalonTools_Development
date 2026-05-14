import React from 'react';
import { History, Calendar, CheckCircle2 } from 'lucide-react';
import { changelogData } from '../data/changelog';

const Changelog = () => {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}>
          <History size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Release Notes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track the latest updates and improvements to KLN Superapp</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {changelogData.map((release, index) => (
          <div key={release.version} className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
            {index === 0 && (
              <div style={{ 
                position: 'absolute', 
                top: '-12px', 
                right: '24px', 
                backgroundColor: 'var(--primary-color)', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '0.75rem', 
                fontWeight: '600' 
              }}>
                Latest Release
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>Version {release.version}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <Calendar size={14} /> {release.date}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {release.changes.map((change, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ marginTop: '4px', color: 'var(--success-color)' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    {change}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <p>© 2026 KLN Superapp Alpha. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Changelog;
