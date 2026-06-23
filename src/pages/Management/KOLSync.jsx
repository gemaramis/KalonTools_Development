import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KOLSync = () => {
  const { getSettingsForMonth, updateMonthlySettings } = useSettings();
  const navigate = useNavigate();
  
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [saved, setSaved] = useState(false);
  const [dealingLink, setDealingLink] = useState('');
  const [schedulingLink, setSchedulingLink] = useState('');

  useEffect(() => {
    const monthSettings = getSettingsForMonth(selectedMonth);
    setDealingLink(monthSettings.dealingSpreadsheetLink || '');
    setSchedulingLink(monthSettings.schedulingSpreadsheetLink || '');
  }, [selectedMonth, getSettingsForMonth]);

  const handleSaveLinks = () => {
    updateMonthlySettings(selectedMonth, {
      dealingSpreadsheetLink: dealingLink,
      schedulingSpreadsheetLink: schedulingLink
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <button onClick={() => navigate('/management')} className="btn" style={{ width: 'fit-content', padding: '8px 16px', background: 'var(--bg-color)' }}>
        <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Management Hub
      </button>

      <div className="flex-between">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>KOL Spreadsheet Sync</h1>
        <select className="input-field" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: '150px' }}>
          {['January', 'February', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          To sync the correct tabs from your single Google Sheet, paste the exact URL of the specific tab you are viewing.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Dealing Tab Link</label>
            <input type="url" className="input-field" value={dealingLink} onChange={(e) => setDealingLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=123456" style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Scheduling Tab Link</label>
            <input type="url" className="input-field" value={schedulingLink} onChange={(e) => setSchedulingLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=987654" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleSaveLinks} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> Save & Sync Links
          </button>
          {saved && <span style={{ color: 'var(--success-color)' }}>Saved successfully!</span>}
        </div>
      </div>
    </div>
  );
};

export default KOLSync;
