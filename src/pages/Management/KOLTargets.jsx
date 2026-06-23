import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Save, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KOLTargets = () => {
  const { getSettingsForMonth, updateMonthlySettings } = useSettings();
  const navigate = useNavigate();
  
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [saved, setSaved] = useState(false);

  const [totalTarget, setTotalTarget] = useState(0);
  const [targetBudget, setTargetBudget] = useState(0);
  const [pics, setPics] = useState([]);

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val).replace(/,00$/, '');
  const parseIDR = (str) => parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;

  useEffect(() => {
    const monthSettings = getSettingsForMonth(selectedMonth);
    setTotalTarget(monthSettings.totalTarget);
    setTargetBudget(monthSettings.targetBudget);
    setPics(monthSettings.pics || []);
  }, [selectedMonth, getSettingsForMonth]);

  const handleSaveTargets = () => {
    updateMonthlySettings(selectedMonth, { totalTarget, targetBudget, pics });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addPic = () => setPics([...pics, { id: Date.now(), name: '', percentage: 0 }]);
  const removePic = (id) => setPics(pics.filter(p => p.id !== id));
  
  const updatePic = (id, field, value) => {
    if (field === 'percentage') {
      const otherTotal = pics.filter(p => p.id !== id).reduce((sum, p) => sum + p.percentage, 0);
      const val = Math.max(0, Math.min(100 - otherTotal, Number(value)));
      setPics(pics.map(p => p.id === id ? { ...p, percentage: val } : p));
    } else {
      setPics(pics.map(p => p.id === id ? { ...p, [field]: value } : p));
    }
  };

  const updatePicTarget = (id, value) => {
    if (totalTarget === 0) return;
    const percentage = (Number(value) / totalTarget) * 100;
    const otherTotal = pics.filter(p => p.id !== id).reduce((sum, p) => sum + p.percentage, 0);
    const finalPercentage = Math.max(0, Math.min(100 - otherTotal, percentage));
    setPics(pics.map(p => p.id === id ? { ...p, percentage: Math.round(finalPercentage * 10) / 10 } : p));
  };

  const totalPercentageUsed = pics.reduce((sum, p) => sum + p.percentage, 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <button onClick={() => navigate('/management')} className="btn" style={{ width: 'fit-content', padding: '8px 16px', background: 'var(--bg-color)' }}>
        <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Management Hub
      </button>

      <div className="flex-between">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>KOL Operations Targets</h1>
        <select className="input-field" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: '150px' }}>
          {['January', 'February', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Total Target KOL Per Month</label>
            <input type="number" className="input-field" value={totalTarget} onChange={(e) => setTotalTarget(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500' }}>Target Budget (IDR)</label>
            <input type="text" className="input-field" value={formatIDR(targetBudget)} onChange={(e) => setTargetBudget(parseIDR(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>

        <div>
          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>PIC Target Distribution</h3>
              <span style={{ fontSize: '0.75rem', color: totalPercentageUsed > 100 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>Total: {totalPercentageUsed}% / 100%</span>
            </div>
            <button onClick={addPic} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} disabled={totalPercentageUsed >= 100}>
              <Plus size={14} /> Add PIC
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pics.map((pic) => (
              <div key={pic.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', backgroundColor: 'var(--bg-color)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem' }}>PIC Name</label>
                  <input type="text" className="input-field" value={pic.name} onChange={(e) => updatePic(pic.id, 'name', e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem' }}>%</label>
                  <input type="number" className="input-field" value={pic.percentage} onChange={(e) => updatePic(pic.id, 'percentage', e.target.value)} style={{ width: '100%' }} max={100 - (totalPercentageUsed - pic.percentage)} />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem' }}>Target Qty</label>
                  <input type="number" className="input-field" value={Math.round((pic.percentage / 100) * totalTarget)} onChange={(e) => updatePicTarget(pic.id, e.target.value)} style={{ width: '100%', fontWeight: '600', color: 'var(--primary-color)' }} />
                </div>
                <button onClick={() => removePic(pic.id)} className="btn" style={{ padding: '8px', color: 'var(--danger-color)' }}><Minus size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleSaveTargets} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> Save Targets
          </button>
          {saved && <span style={{ color: 'var(--success-color)' }}>Saved!</span>}
        </div>
      </div>
    </div>
  );
};

export default KOLTargets;
