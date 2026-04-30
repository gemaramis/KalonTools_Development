import React, { useState, useMemo } from 'react';
import { useGoogleSheetData } from '../../hooks/useGoogleSheetData';
import { useSettings } from '../../context/SettingsContext';
import { Users, CheckCircle, XCircle, DollarSign, TrendingUp, Eye, Loader2 } from 'lucide-react';

const Overview = () => {
  const { getSettingsForMonth } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState('All');
  
  const monthSettings = useMemo(() => {
    return getSettingsForMonth(selectedMonth === 'All' ? 'January' : selectedMonth);
  }, [selectedMonth, getSettingsForMonth]);

  const { data: kolData, loading, error } = useGoogleSheetData(monthSettings.dealingSpreadsheetLink);

  const filteredData = useMemo(() => {
    if (!kolData) return [];
    if (selectedMonth === 'All') return kolData;
    return kolData.filter(item => item.postingPeriod === selectedMonth);
  }, [selectedMonth, kolData]);

  const stats = useMemo(() => {
    const totalMega = filteredData.filter(d => d.tier === 'Mega').length;
    const totalMakro = filteredData.filter(d => d.tier === 'Makro').length;
    const totalMikro = filteredData.filter(d => d.tier === 'Mikro').length;

    const totalDeal = filteredData.filter(d => d.dealingStatus === 'Deal').length;
    const totalReject = filteredData.filter(d => d.dealingStatus === 'Cancel' || d.approval === 'Rejected').length;

    const totalBudget = filteredData.reduce((sum, item) => sum + (item.finalPrice || 0), 0);
    const totalGMV = filteredData.reduce((sum, item) => sum + (item.gmv || 0), 0);
    const totalViews = filteredData.reduce((sum, item) => sum + (item.views || 0), 0);

    const roi = totalBudget > 0 ? (totalGMV / totalBudget).toFixed(2) : 0;

    // Calculate deals per PIC based on dynamic list
    const picStats = monthSettings.pics.map(pic => {
      const deals = filteredData.filter(d => d.pic === pic.name && d.dealingStatus === 'Deal').length;
      const target = Math.round((pic.percentage / 100) * monthSettings.totalTarget);
      return { ...pic, deals, target };
    });

    return { totalMega, totalMakro, totalMikro, totalDeal, totalReject, totalBudget, totalGMV, totalViews, roi, picStats };
  }, [filteredData, monthSettings]);

  const formatCurrency = (value) => {
    const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
    return formatted.replace(/,00$/, '');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary-color)" />
        <p>Loading spreadsheet data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ height: '100%', color: 'var(--danger-color)' }}>
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>KOL Analytics Overview</h1>
        <div>
          <select className="input-field" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: '200px' }}>
            <option value="All">All Months</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="Maret">Maret</option>
            <option value="April">April</option>
            <option value="Mei">Mei</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {/* Distribution Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="flex-center" style={{ gap: '12px', justifyContent: 'flex-start', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            <Users size={20} /> <h3 style={{ fontWeight: '600' }}>Distribution</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Mega</span> <span style={{ fontWeight: '600' }}>{stats.totalMega}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Makro</span> <span style={{ fontWeight: '600' }}>{stats.totalMakro}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Mikro</span> <span style={{ fontWeight: '600' }}>{stats.totalMikro}</span>
          </div>
        </div>

        {/* Status Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="flex-center" style={{ gap: '12px', justifyContent: 'flex-start', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={20} /> <h3 style={{ fontWeight: '600' }}>Status</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--success-color)' }}>Total Dealing</span> <span style={{ fontWeight: '600' }}>{stats.totalDeal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--danger-color)' }}>Total Rejected</span> <span style={{ fontWeight: '600' }}>{stats.totalReject}</span>
          </div>
        </div>

        {/* Financials Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="flex-center" style={{ gap: '12px', justifyContent: 'flex-start', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            <DollarSign size={20} /> <h3 style={{ fontWeight: '600' }}>Financials</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Spent Budget</span> <span style={{ fontWeight: '600', color: 'var(--warning-color)' }}>{formatCurrency(stats.totalBudget)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Target Budget</span> <span style={{ fontWeight: '600' }}>{formatCurrency(monthSettings.targetBudget)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Total GMV</span> <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>{formatCurrency(stats.totalGMV)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={16} /> Total Views</span> <span style={{ fontWeight: '600' }}>{stats.totalViews.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* ROI Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--primary-color)', color: 'white' }}>
          <TrendingUp size={32} style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1rem', opacity: 0.9 }}>Return on Investment (ROI)</h3>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '8px' }}>{stats.roi}x</h2>
        </div>
      </div>

      {/* Target Trackers */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '20px' }}>PIC Target Tracker (Month: {selectedMonth})</h3>
        
        {stats.picStats.length > 0 ? stats.picStats.map((pic, idx) => (
          <div key={pic.id} style={{ marginBottom: idx === stats.picStats.length - 1 ? 0 : '20px' }}>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '500' }}>{pic.name}'s Progress ({pic.percentage}%)</span>
              <span>{pic.deals} / {pic.target}</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min((pic.deals / Math.max(pic.target, 1)) * 100, 100)}%`, 
                height: '100%', 
                backgroundColor: idx % 2 === 0 ? 'var(--primary-color)' : 'var(--accent-color)', 
                transition: 'width 0.5s ease' 
              }}></div>
            </div>
          </div>
        )) : (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No PIC targets set for this month.</p>
        )}
      </div>
    </div>
  );
};

export default Overview;
