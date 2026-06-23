import React, { useState } from 'react';
import { useEcommerceData } from '../../hooks/useEcommerceData';
import { kolMockData } from '../../data/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

const Reporting = () => {
  const { data: ecommData, isLoading } = useEcommerceData();
  const [source, setSource] = useState('all');

  const CHART_COLORS = ['var(--primary-color)', '#7e9c5a', '#a6c07d', 'var(--danger-color)'];

  const totalDeals = kolMockData.filter(d => d.dealingStatus === 'Deal' || d.dealingStatus === 'Dealed').length;
  const totalBudget = kolMockData.reduce((sum, item) => sum + (item.budget || 0), 0);
  
  const ecommTotalGmv = ecommData ? ecommData.reduce((sum, row) => {
    return sum + (parseInt(row['GMV']?.toString().replace(/[^0-9]/g, '')) || 0);
  }, 0) : 0;

  const combinedData = [
    { name: 'Jan', KOL: 12000000, Ads: 8000000, Ecomm: 45000000 },
    { name: 'Feb', KOL: 15000000, Ads: 9500000, Ecomm: 52000000 },
    { name: 'Mar', KOL: 18000000, Ads: 11000000, Ecomm: 61000000 },
    { name: 'Apr', KOL: 14000000, Ads: 8500000, Ecomm: 48000000 },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Aggregate Reporting</h1>
        <select className="input-field" value={source} onChange={(e) => setSource(e.target.value)} style={{ width: '200px' }}>
          <option value="all">All Sources</option>
          <option value="kol">KOL Module</option>
          <option value="ads">Ads Management</option>
          <option value="ecomm">Ecommerce</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total KOL Deals</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>{totalDeals}</p>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total KOL Budget Spent</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>Rp {(totalBudget/1000000).toFixed(1)} M</p>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Ecommerce GMV</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>Rp {(ecommTotalGmv/1000000).toFixed(1)} M</p>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Blended ROI</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-color)' }}>3.4x</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', minHeight: '400px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '24px' }}>Revenue Breakdown by Source</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(val) => `Rp ${val/1000000}M`} />
            <Tooltip formatter={(val) => `Rp ${new Intl.NumberFormat('id-ID').format(val)}`} />
            <Legend />
            {(source === 'all' || source === 'kol') && <Bar dataKey="KOL" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />}
            {(source === 'all' || source === 'ads') && <Bar dataKey="Ads" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />}
            {(source === 'all' || source === 'ecomm') && <Bar dataKey="Ecomm" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reporting;
