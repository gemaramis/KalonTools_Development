import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { kolMockData } from '../data/mockData'; // Needed for personal report mock stats
import { Save, Settings, Plus, Minus, Target, Link2 } from 'lucide-react';

const Management = () => {
  const { currentUser, permissions } = useAuth();
  const { getSettingsForMonth, updateMonthlySettings, globalSettings, setGlobalSettings } = useSettings();
  
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [saved, setSaved] = useState(false);
  const [linksSaved, setLinksSaved] = useState(false);

  // Form states for settings
  const [totalTarget, setTotalTarget] = useState(0);
  const [targetBudget, setTargetBudget] = useState(0);
  const [pics, setPics] = useState([]);

  // Form states for links
  const [dealingLink, setDealingLink] = useState('');
  const [schedulingLink, setSchedulingLink] = useState('');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');

  const isSuperAdmin = currentUser?.id === 'superadmin';
  const isManagement = currentUser?.id === 'management' || isSuperAdmin;
  const isKol = currentUser?.id === 'kol';

  // Load settings when month changes
  useEffect(() => {
    const monthSettings = getSettingsForMonth(selectedMonth);
    setTotalTarget(monthSettings.totalTarget);
    setTargetBudget(monthSettings.targetBudget);
    setPics(monthSettings.pics || []);
    setDealingLink(monthSettings.dealingSpreadsheetLink || '');
    setSchedulingLink(monthSettings.schedulingSpreadsheetLink || '');
    setAppsScriptUrl(globalSettings?.appsScriptUrl || '');
  }, [selectedMonth, getSettingsForMonth, globalSettings]);

  const handleSaveTargets = () => {
    updateMonthlySettings(selectedMonth, {
      totalTarget,
      targetBudget,
      pics
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveLinks = () => {
    updateMonthlySettings(selectedMonth, {
      dealingSpreadsheetLink: dealingLink,
      schedulingSpreadsheetLink: schedulingLink
    });
    setGlobalSettings(prev => ({ ...prev, appsScriptUrl }));
    setLinksSaved(true);
    setTimeout(() => setLinksSaved(false), 3000);
  };

  const addPic = () => {
    setPics([...pics, { id: Date.now(), name: '', percentage: 0 }]);
  };

  const removePic = (id) => {
    setPics(pics.filter(p => p.id !== id));
  };

  const updatePic = (id, field, value) => {
    setPics(pics.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // --- Personal Report Logic (For KOL Role) ---
  const personalStats = React.useMemo(() => {
    if (!isKol) return null;
    // Note: Assuming currentUser.name or similar would match the PIC name. 
    // In our mock, KOL Team is "Amel/Ken". Let's show Amel's stats for demonstration, 
    // or if we split them, we'd use their actual name. For mock, let's just aggregate 
    // or assume the user is "Amel".
    const mockUserName = 'Amel'; 
    const monthSettings = getSettingsForMonth(selectedMonth);
    const picSetting = monthSettings.pics.find(p => p.name === mockUserName);
    
    const personalTarget = picSetting ? Math.round((picSetting.percentage / 100) * monthSettings.totalTarget) : 0;
    
    // Calculate completed from mockData
    const completedDeals = kolMockData.filter(d => d.postingPeriod === selectedMonth && d.pic === mockUserName && d.dealingStatus === 'Deal').length;
    // Scheduling would have similar logic. Let's just mock it based on deals.
    const completedSchedules = kolMockData.filter(d => d.postingPeriod === selectedMonth && d.pic === mockUserName && d.dealingStatus === 'Deal').length;

    return {
      name: mockUserName,
      target: personalTarget,
      completedDeals,
      completedSchedules,
      remaining: Math.max(0, personalTarget - Math.max(completedDeals, completedSchedules))
    };
  }, [isKol, selectedMonth, getSettingsForMonth]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <div className="flex-between">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={24} color="var(--primary-color)" /> {isKol ? 'My Dashboard & Settings' : 'Management & Settings'}
        </h1>
        <div>
          <select className="input-field" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: '150px' }}>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="Maret">Maret</option>
            <option value="April">April</option>
            <option value="Mei">Mei</option>
          </select>
        </div>
      </div>

      {isManagement && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            KOL Operations Targets ({selectedMonth})
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Total Target KOL Per Month</label>
              <input 
                type="number" 
                className="input-field" 
                value={totalTarget} 
                onChange={(e) => setTotalTarget(Number(e.target.value))} 
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Target Budget (IDR)</label>
              <input 
                type="number" 
                className="input-field" 
                value={targetBudget} 
                onChange={(e) => setTargetBudget(Number(e.target.value))} 
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>PIC Target Distribution</h3>
              <button onClick={addPic} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                <Plus size={14} /> Add PIC
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pics.map((pic, index) => {
                const targetValue = Math.round((pic.percentage / 100) * totalTarget);
                return (
                  <div key={pic.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', backgroundColor: 'var(--bg-color)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: '500' }}>PIC Name</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={pic.name} 
                        onChange={(e) => updatePic(pic.id, 'name', e.target.value)} 
                        style={{ width: '100%' }}
                        placeholder="e.g. Amel"
                      />
                    </div>
                    <div style={{ width: '100px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: '500' }}>Percentage (%)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={pic.percentage} 
                        onChange={(e) => updatePic(pic.id, 'percentage', Number(e.target.value))} 
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ width: '120px', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                        Target: {targetValue}
                      </span>
                    </div>
                    <button onClick={() => removePic(pic.id)} className="btn" style={{ padding: '8px', color: 'var(--danger-color)', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                      <Minus size={16} />
                    </button>
                  </div>
                );
              })}
              {pics.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No PICs added. Target will be 0.</p>}
            </div>
          </div>

          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={handleSaveTargets} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Save Targets
            </button>
            {saved && <span style={{ color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: '500' }}>Targets saved successfully!</span>}
          </div>
        </div>
      )}

      {isKol && personalStats && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} /> Personal Report ({selectedMonth})
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
      )}

      {(isKol || isSuperAdmin) && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={20} /> Spreadsheet Sync
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            To sync the correct tabs from your single Google Sheet, paste the exact URL of the specific tab you are viewing. The system will automatically extract the Tab ID.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Dealing Tab Link</label>
              <input 
                type="url" 
                className="input-field" 
                value={dealingLink} 
                onChange={(e) => setDealingLink(e.target.value)} 
                placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=123456"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Scheduling Tab Link</label>
              <input 
                type="url" 
                className="input-field" 
                value={schedulingLink} 
                onChange={(e) => setSchedulingLink(e.target.value)} 
                placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=987654"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Apps Script Web App URL (For Live Sync)</label>
              <input 
                type="url" 
                className="input-field" 
                value={appsScriptUrl} 
                onChange={(e) => setAppsScriptUrl(e.target.value)} 
                placeholder="https://script.google.com/macros/s/.../exec"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={handleSaveLinks} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Save & Sync Links
            </button>
            {linksSaved && <span style={{ color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: '500' }}>Links saved and synced!</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;
