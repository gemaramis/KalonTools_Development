import React, { useState, useMemo } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { kolMockData } from '../../data/mockData';
import { ArrowLeft, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PersonalReport = () => {
  const { getSettingsForMonth } = useSettings();
  const navigate = useNavigate();
  
  const [selectedMonth, setSelectedMonth] = useState('January');

  const personalStats = useMemo(() => {
    const mockUserName = 'Amel'; 
    const monthSettings = getSettingsForMonth(selectedMonth);
    const picSetting = monthSettings.pics.find(p => p.name === mockUserName);
    
    const personalTarget = picSetting ? Math.round((picSetting.percentage / 100) * monthSettings.totalTarget) : 0;
    const completedDeals = kolMockData.filter(d => d.postingPeriod === selectedMonth && d.pic === mockUserName && (d.dealingStatus === 'Deal' || d.dealingStatus === 'Dealed')).length;
    const completedSchedules = completedDeals;

    return {
      name: mockUserName,
      target: personalTarget,
      completedDeals,
      completedSchedules,
      remaining: Math.max(0, personalTarget - Math.max(completedDeals, completedSchedules))
    };
  }, [selectedMonth, getSettingsForMonth]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <button onClick={() => navigate('/management')} className="btn" style={{ width: 'fit-content', padding: '8px 16px', background: 'var(--bg-color)' }}>
        <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Management Hub
      </button>

      <div className="flex-between">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Personal Report</h1>
        <select className="input-field" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: '150px' }}>
          {['January', 'February', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} /> Targets vs Actuals
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>My Target</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>{personalStats.target}</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Deals Done</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-color)' }}>{personalStats.completedDeals}</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Schedules Done</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-color)' }}>{personalStats.completedSchedules}</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Remaining</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger-color)' }}>{personalStats.remaining}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalReport;
