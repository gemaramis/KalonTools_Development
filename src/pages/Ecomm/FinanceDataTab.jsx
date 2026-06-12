import React, { useMemo, useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const baseFormatRp = (value) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

const FinanceDataTab = ({ financeData, mainData, isDataHidden }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  
  const formatRp = (value) => isDataHidden ? 'Rp ***.***' : baseFormatRp(value);

  const shopGmvByMonth = useMemo(() => {
    const agg = {};
    if (!mainData) return agg;
    mainData.forEach(d => {
      if (d.month && d.gmv) {
         const idToEn = { 
           'januari': 'January', 'februari': 'February', 'maret': 'Maret', 'april': 'April', 'mei': 'Mei',
           'jan': 'January', 'feb': 'February', 'mar': 'Maret', 'apr': 'April'
         };
         const enMonth = idToEn[d.month.toLowerCase().trim()] || d.month;
         if (!agg[enMonth]) agg[enMonth] = 0;
         agg[enMonth] += d.gmv;
      }
    });
    return agg;
  }, [mainData]);

  // Transform data for chart and analysis
  const enhancedData = useMemo(() => {
    if (!financeData) return [];
    return financeData.map(d => {
      const totalMarketing = d.adsBudget + d.kolBudget;
      const totalFinanceExpenses = d.revenue - d.settlement;
      const marketingRatio = totalFinanceExpenses > 0 ? (totalMarketing / totalFinanceExpenses) * 100 : 0;
      
      return {
        ...d,
        shopGmv: shopGmvByMonth[d.month] || 0,
        totalMarketing,
        totalFinanceExpenses,
        marketingRatio
      };
    });
  }, [financeData, shopGmvByMonth]);

  if (!enhancedData || enhancedData.length === 0) {
    return (
      <div className="animation-fade-in" style={{ padding: '24px 0' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>Finance Actual Data</h2>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-color)', borderRadius: '12px' }}>
          Data Finance belum tersedia atau gagal dimuat.
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (enhancedData && enhancedData.length > 0 && (!selectedMonth || !enhancedData.find(d => d.month === selectedMonth))) {
      setSelectedMonth(enhancedData[enhancedData.length - 1].month);
    }
  }, [enhancedData, selectedMonth]);

  // Key Insights Generator
  const generateInsights = () => {
    const insights = [];
    if (!enhancedData || enhancedData.length < 1 || !selectedMonth) return insights;
    
    const currentIndex = enhancedData.findIndex(d => d.month === selectedMonth);
    if (currentIndex <= 0) return insights;
    
    const last = enhancedData[currentIndex];
    const prev = enhancedData[currentIndex - 1];

    // Shipping cost insight
    if (last.shippingCost && prev.shippingCost) {
      const shippingDiff = Math.abs(last.shippingCost) - Math.abs(prev.shippingCost);
      const shippingPct = (shippingDiff / Math.abs(prev.shippingCost)) * 100;
      if (shippingPct > 15) {
        insights.push({
          type: 'danger',
          title: 'Lonjakan Ongkos Kirim',
          text: `Pada bulan ${last.month}, biaya ongkos kirim melambung tinggi sebesar ${shippingPct.toFixed(1)}% dibandingkan bulan sebelumnya.`
        });
      } else if (shippingPct < -15) {
        insights.push({
          type: 'success',
          title: 'Ongkos Kirim Turun',
          text: `Biaya ongkos kirim di bulan ${last.month} berhasil ditekan turun ${Math.abs(shippingPct).toFixed(1)}% dari bulan sebelumnya.`
        });
      }
    }

    // Admin & Commission Insight
    const lastAdmin = Math.abs(last.adminMall + last.adminOrder);
    const prevAdmin = Math.abs(prev.adminMall + prev.adminOrder);
    if (lastAdmin > prevAdmin * 1.2) {
      insights.push({
        type: 'danger',
        title: 'Kenaikan Biaya Admin',
        text: `Biaya admin (Mall & Order) naik tajam menjadi ${formatRp(lastAdmin)} di bulan ${last.month}.`
      });
    }

    // Settlement vs Revenue
    if (last.settlement > prev.settlement) {
      insights.push({
        type: 'success',
        title: 'Pendapatan Bersih Tumbuh',
        text: `Pendapatan bersih (Settlement) tumbuh ${(((last.settlement - prev.settlement)/prev.settlement)*100).toFixed(1)}% menjadi ${formatRp(last.settlement)}.`
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Penurunan Pendapatan Bersih',
        text: `Pendapatan bersih bulan ${last.month} mengalami kontraksi sebesar ${Math.abs(((last.settlement - prev.settlement)/prev.settlement)*100).toFixed(1)}%.`
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="animation-fade-in" style={{ padding: '24px 0' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>Finance Actual Data</h2>
      
      {/* 4. VISUALISASI DATA */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>Perbandingan Pendapatan Bersih vs Pengeluaran Marketing</h3>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <ComposedChart data={enhancedData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={10} />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                tickFormatter={(value) => `Rp${(value / 1000000000).toFixed(1)}B`}
                dx={-10}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
                dx={10}
              />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                formatter={(value) => formatRp(value)}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar yAxisId="right" dataKey="adsBudget" name="TikTok Ads Budget" stackId="a" fill="var(--primary-color)" radius={[0, 0, 0, 0]} maxBarSize={60} />
              <Bar yAxisId="right" dataKey="kolBudget" name="KOL Budget" stackId="a" fill="var(--warning-color)" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Line yAxisId="left" type="monotone" dataKey="settlement" name="Net Income (Settlement)" stroke="var(--success-color)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Rincian & Insight Bulanan</h3>
        <select 
          className="input-field" 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ width: '200px', backgroundColor: 'var(--surface-color)' }}
        >
          {enhancedData.map(d => (
            <option key={d.month} value={d.month}>{d.month}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* 1. RINCIAN PENGELUARAN MARKETING */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Rincian Pengeluaran Marketing</h3>
          {(() => {
            const last = enhancedData.find(d => d.month === selectedMonth) || enhancedData[enhancedData.length - 1];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Budget Ads (Iklan)</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatRp(last.adsBudget)}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Budget KOL</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatRp(last.kolBudget)}</span>
                </div>
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />
                <div className="flex-between">
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Total Pengeluaran Marketing</span>
                  <span style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--text-primary)' }}>{formatRp(last.totalMarketing)}</span>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'rgba(100, 108, 255, 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    Pengeluaran marketing memakan porsi sebesar <strong style={{ color: 'var(--primary-color)' }}>{last.marketingRatio.toFixed(1)}%</strong> dari total seluruh pengeluaran finansial bulanan ({formatRp(last.totalFinanceExpenses)}).
                  </p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 2. ANALISIS LONJAKAN BIAYA */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Key Insights (Analisis Lonjakan)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((insight, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '2px', color: insight.type === 'danger' ? 'var(--danger-color)' : insight.type === 'success' ? 'var(--success-color)' : 'var(--warning-color)' }}>
                  {insight.type === 'danger' ? <TrendingUp size={20} /> : insight.type === 'success' ? <TrendingDown size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{insight.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{insight.text}</div>
                </div>
              </div>
            ))}
            {insights.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                {enhancedData.findIndex(d => d.month === selectedMonth) === 0 
                  ? 'Pilih bulan setelahnya untuk melihat komparasi lonjakan biaya.' 
                  : 'Tidak ada insight khusus bulan ini.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. DISCREPANCY ANALYSIS */}
      <div className="glass-panel" style={{ overflowX: 'auto', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', padding: '24px 24px 16px', margin: 0, color: 'var(--text-primary)' }}>Discrepancy Analysis (Selisih Data Metrik)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-secondary)' }}>Bulan</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>GMV Ads Target</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>GMV Shop Aktual</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Finance Revenue</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-secondary)' }}>Margin Selisih (Shop vs Ads)</th>
            </tr>
          </thead>
          <tbody>
            {enhancedData.map(d => {
              const diffShopAds = d.shopGmv - d.adsGmv;
              const diffPct = d.adsGmv ? (diffShopAds / d.adsGmv) * 100 : 0;
              return (
                <tr key={d.month} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: '600' }}>{d.month}</td>
                  <td style={{ padding: '16px' }}>{formatRp(d.adsGmv)}</td>
                  <td style={{ padding: '16px' }}>{formatRp(d.shopGmv)}</td>
                  <td style={{ padding: '16px', color: 'var(--primary-color)' }}>{formatRp(d.revenue)}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', color: diffShopAds < 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                        {diffShopAds > 0 ? '+' : ''}{formatRp(diffShopAds)}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>
                        {diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default FinanceDataTab;
