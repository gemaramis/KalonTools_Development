import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EcommSync = () => {
  const { globalSettings, setGlobalSettings } = useSettings();
  const navigate = useNavigate();
  
  const [saved, setSaved] = useState(false);
  const [ecommLink, setEcommLink] = useState('');
  const [financeLink, setFinanceLink] = useState('');
  const [adsLink, setAdsLink] = useState('');
  const [contentDistLink, setContentDistLink] = useState('');

  useEffect(() => {
    setEcommLink(globalSettings?.ecommLink || '');
    setFinanceLink(globalSettings?.financeLink || '');
    setAdsLink(globalSettings?.adsLink || '');
    setContentDistLink(globalSettings?.contentDistLink || '');
  }, [globalSettings]);

  const handleSaveLinks = () => {
    setGlobalSettings(prev => ({ 
      ...prev, 
      ecommLink,
      financeLink,
      adsLink,
      contentDistLink
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <button onClick={() => navigate('/management')} className="btn" style={{ width: 'fit-content', padding: '8px 16px', background: 'var(--bg-color)' }}>
        <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Management Hub
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Ecommerce & Ads Sync</h1>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Ecommerce Spreadsheet Link</label>
            <input type="url" className="input-field" value={ecommLink} onChange={(e) => setEcommLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=1551198310" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Finance Actual Data Link</label>
            <input type="url" className="input-field" value={financeLink} onChange={(e) => setFinanceLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=251030538" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Ads Spreadsheet Link</label>
            <input type="url" className="input-field" value={adsLink} onChange={(e) => setAdsLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=..." style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Content Distribution Link</label>
            <input type="url" className="input-field" value={contentDistLink} onChange={(e) => setContentDistLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=1450102889" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleSaveLinks} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> Save Ecomm Links
          </button>
          {saved && <span style={{ color: 'var(--success-color)' }}>Saved successfully!</span>}
        </div>
      </div>
    </div>
  );
};

export default EcommSync;
