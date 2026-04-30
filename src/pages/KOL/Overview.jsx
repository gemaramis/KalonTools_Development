import React, { useState, useMemo } from 'react';
import { useGoogleSheetData } from '../../hooks/useGoogleSheetData';
import { useSettings } from '../../context/SettingsContext';
import { Users, CheckCircle, XCircle, DollarSign, TrendingUp, Eye, Loader2, Target } from 'lucide-react';

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
    const picStats = (monthSettings.pics || []).map(pic => {
      const picData = filteredData.filter(d => d.pic === pic.name);
      const deals = picData.filter(d => d.dealingStatus === 'Deal' || d.dealingStatus === 'Dealed').length;
      const target = Math.round((pic.percentage / 100) * (monthSettings.totalTarget || 0));
      
      const megaCount = picData.filter(d => d.tier === 'Mega').length;
      const makroCount = picData.filter(d => d.tier === 'Makro').length;
      const mikroCount = picData.filter(d => d.tier === 'Mikro').length;
      const postedCount = picData.filter(d => d.postLink && d.postLink !== '-').length;

      return { ...pic, deals, target, megaCount, makroCount, mikroCount, listed: picData.length, posted: postedCount };
    });

    const successRate = filteredData.length > 0 ? Math.round((totalDeal / filteredData.length) * 100) : 0;
    
    // Status distribution for donut chart
    const statusCounts = {
      dealed: totalDeal,
      pending: filteredData.length - totalDeal - totalReject,
      rejected: totalReject
    };

    return { totalMega, totalMakro, totalMikro, totalDeal, totalReject, totalBudget, totalGMV, totalViews, roi, picStats, successRate, statusCounts, totalListed: filteredData.length };
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Personal Progress per KOL */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} /> Personal Progress per PIC</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.picStats.length > 0 ? stats.picStats.map((pic, idx) => (
              <div key={pic.id || pic.name || idx} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-color)' }}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600' }}>{pic.name}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Target: {pic.target}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.875rem', marginBottom: '8px' }}>
                  <div style={{ background: 'var(--surface-color)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Mega</div>
                    <div style={{ fontWeight: '600' }}>{pic.megaCount}</div>
                  </div>
                  <div style={{ background: 'var(--surface-color)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Makro</div>
                    <div style={{ fontWeight: '600' }}>{pic.makroCount}</div>
                  </div>
                  <div style={{ background: 'var(--surface-color)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Mikro</div>
                    <div style={{ fontWeight: '600' }}>{pic.mikroCount}</div>
                  </div>
                </div>
                <div className="flex-between" style={{ fontSize: '0.875rem', marginTop: '12px' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Listed:</span> <span style={{ fontWeight: '600' }}>{pic.listed}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Dealing:</span> <span style={{ fontWeight: '600', color: 'var(--warning-color)' }}>{pic.deals}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Posted:</span> <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>{pic.posted}</span></div>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No PIC data available.</p>
            )}
          </div>
        </div>

        {/* Success Rate & Target */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Donut Chart */}
          <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '20px', width: '100%' }}><Target size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Conversion Rate</h3>
            
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                {/* Background Circle */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--bg-color)"
                  strokeWidth="3"
                />
                
                {/* Dealed Slice */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--success-color)"
                  strokeWidth="3"
                  strokeDasharray={`${stats.totalListed > 0 ? (stats.statusCounts.dealed / stats.totalListed) * 100 : 0}, 100`}
                />
              </svg>
              
              {/* Inner Text */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.successRate}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Success Rate</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></div>
                <span>Dealed ({stats.statusCounts.dealed})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--bg-color)' }}></div>
                <span>Other ({stats.totalListed - stats.statusCounts.dealed})</span>
              </div>
            </div>
          </div>

          {/* Target Progress */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Overall Achievement</h3>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Listing Progress</span>
              <span style={{ fontWeight: '600' }}>{stats.totalListed} / {monthSettings.totalTarget}</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min((stats.totalListed / Math.max(monthSettings.totalTarget || 1, 1)) * 100, 100)}%`, 
                height: '100%', 
                backgroundColor: 'var(--primary-color)', 
                transition: 'width 0.5s ease' 
              }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
