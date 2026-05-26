import React, { useMemo } from 'react';

const formatRp = (value) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

const FinanceDataTab = ({ financeData, activeTab }) => {
  if (activeTab !== 'Finance Data') return null;

  // Render month-over-month comparisons
  return (
    <div className="animation-fade-in" style={{ padding: '24px 0' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>Finance Actual Data</h2>
      
      {(!financeData || financeData.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-color)', borderRadius: '12px' }}>
          Data Finance belum tersedia atau gagal dimuat.
        </div>
      ) : (
        <>
          <div className="glass-panel" style={{ overflowX: 'auto', marginBottom: '32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Metrik Biaya / Pendapatan</th>
                  {financeData.map(d => (
                    <th key={d.month} style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>{d.month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>Total Settlement (Pendapatan Bersih)</td>
                  {financeData.map(d => <td key={d.month} style={{ padding: '16px', color: 'var(--primary-color)', fontWeight: '600' }}>{formatRp(d.settlement)}</td>)}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>Total Revenue (Kotor)</td>
                  {financeData.map(d => <td key={d.month} style={{ padding: '16px' }}>{formatRp(d.revenue)}</td>)}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>Biaya Komisi Platform</td>
                  {financeData.map(d => <td key={d.month} style={{ padding: '16px', color: 'var(--danger-color)' }}>{formatRp(d.platformCommission + d.dynamicCommission)}</td>)}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>Biaya Admin / Layanan (Mall & Order)</td>
                  {financeData.map(d => <td key={d.month} style={{ padding: '16px', color: 'var(--danger-color)' }}>{formatRp(d.adminMall + d.adminOrder)}</td>)}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>Biaya Campaign (Package)</td>
                  {financeData.map(d => <td key={d.month} style={{ padding: '16px', color: 'var(--danger-color)' }}>{formatRp(d.campaignPackage + d.campaignAdditional)}</td>)}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>Biaya Komisi Affiliate</td>
                  {financeData.map(d => <td key={d.month} style={{ padding: '16px', color: 'var(--danger-color)' }}>{formatRp(d.affiliateCommission)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Key Insights (Bulan Terakhir)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {(() => {
              const last = financeData[financeData.length - 1];
              const prev = financeData.length > 1 ? financeData[financeData.length - 2] : null;
              
              if (!prev || !last) return null;

              const renderInsight = (title, lastVal, prevVal) => {
                const isExpense = lastVal < 0; // Expenses are negative
                const diff = lastVal - prevVal;
                // If expense, going more negative is a "spike" (increase in cost). So we use absolute for percentage.
                const pct = prevVal !== 0 ? (Math.abs(lastVal) - Math.abs(prevVal)) / Math.abs(prevVal) * 100 : 0;
                
                const isSpike = pct > 10; // More than 10% increase
                let color = 'var(--text-secondary)';
                if (isSpike) color = 'var(--danger-color)'; // Red for spike
                else if (pct < 0) color = 'var(--success-color)'; // Green for decrease in cost

                return (
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{title}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {formatRp(Math.abs(lastVal))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color }}>
                      <span style={{ fontWeight: '600' }}>
                        {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>vs bulan lalu ({formatRp(Math.abs(prevVal))})</span>
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {renderInsight('Total Biaya Komisi', (last.platformCommission + last.dynamicCommission), (prev.platformCommission + prev.dynamicCommission))}
                  {renderInsight('Total Biaya Admin', (last.adminMall + last.adminOrder), (prev.adminMall + prev.adminOrder))}
                  {renderInsight('Total Biaya Campaign', (last.campaignPackage + last.campaignAdditional), (prev.campaignPackage + prev.campaignAdditional))}
                  {renderInsight('Komisi Affiliate', last.affiliateCommission, prev.affiliateCommission)}
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceDataTab;
