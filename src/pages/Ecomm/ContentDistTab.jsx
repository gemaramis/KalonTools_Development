import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList } from 'recharts';
import { AlertCircle, CheckCircle, Clock, BookOpen, AlertTriangle } from 'lucide-react';

const renderBarLabel = (props, pctKey) => {
  const { x, y, width, height, value, payload } = props;
  if (height < 18 || !value) return null; // Don't render label if bar is too small
  
  const pct = payload[pctKey];
  if (pct === undefined || pct === 0) return null;

  // For very light colors we might want dark text, but since we use distinct colors, white is usually good.
  // Not Active is gray, Delivering is green, Learning is blue, In Queue is yellow/orange, Rejected is red.
  // White looks good on all except maybe yellow, but it's acceptable.
  return (
    <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600" style={{ pointerEvents: 'none' }}>
      {pct.toFixed(1)}%
    </text>
  );
};

const ContentDistTab = ({ contentDistData, activeTab }) => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const availableMonths = useMemo(() => {
    if (!contentDistData) return [];
    const months = new Set(contentDistData.map(d => d.month).filter(Boolean));
    return Array.from(months);
  }, [contentDistData]);

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const availableProducts = useMemo(() => {
    if (!contentDistData || !selectedMonth) return [];
    return contentDistData.filter(d => d.month === selectedMonth).map(d => d.product);
  }, [contentDistData, selectedMonth]);

  useEffect(() => {
    if (availableProducts.length > 0 && (!selectedProduct || !availableProducts.includes(selectedProduct))) {
      setSelectedProduct(availableProducts[0]);
    }
  }, [availableProducts, selectedProduct]);

  const productData = useMemo(() => {
    if (!contentDistData || contentDistData.length === 0 || !selectedMonth || !selectedProduct) return null;
    
    const prod = contentDistData.find(p => p.month === selectedMonth && p.product === selectedProduct);
    if (!prod) return null;
    
    // Transform data for charting and table
    const transformedWeeks = prod.weeks.map((w, index) => {
      const prevWeek = index > 0 ? prod.weeks[index - 1] : null;
      
      const calcGrowth = (curr, prev) => {
        if (!prev || prev === 0) return 0;
        return ((curr - prev) / prev) * 100;
      };

      return {
        ...w,
        rejectedGrowth: calcGrowth(w.rejected, prevWeek?.rejected),
        deliveringGrowth: calcGrowth(w.delivering, prevWeek?.delivering),
        readyPctOfTotal: w.totalVideo > 0 ? (w.ready / w.totalVideo) * 100 : 0,
        notActivePctOfTotal: w.totalVideo > 0 ? (w.notActive / w.totalVideo) * 100 : 0,
        inQueuePct: w.ready > 0 ? (w.inQueue / w.ready) * 100 : 0,
        learningPct: w.inQueue > 0 ? (w.learning / w.inQueue) * 100 : 0,
        rejectedPct: w.ready > 0 ? (w.rejected / w.ready) * 100 : 0,
        deliveringPct: w.ready > 0 ? (w.delivering / w.ready) * 100 : 0,
      };
    });

    return {
      product: prod.product,
      weeks: transformedWeeks
    };
  }, [contentDistData, selectedProduct]);

  if (activeTab !== 'Content Distribution') return null;

  if (!contentDistData || contentDistData.length === 0) {
    return (
      <div className="animation-fade-in" style={{ padding: '24px 0' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>Content Distribution Database (TikTok)</h2>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-color)', borderRadius: '12px' }}>
          Data distribusi konten belum tersedia atau gagal dimuat.
        </div>
      </div>
    );
  }

  const formatNumber = (val) => new Intl.NumberFormat('id-ID').format(val);

  return (
    <div className="animation-fade-in" style={{ padding: '24px 0' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>Content Distribution Database (TikTok)</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <select 
            className="input-field" 
            value={selectedMonth || ''} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: '200px', backgroundColor: 'var(--surface-color)' }}
          >
            {availableMonths.map((m, i) => (
              <option key={i} value={m}>{m}</option>
            ))}
          </select>
          <select 
            className="input-field" 
            value={selectedProduct || ''} 
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{ width: '250px', backgroundColor: 'var(--surface-color)' }}
          >
            {availableProducts.map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {productData && (
        <>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Funnel Distribusi Konten - {productData.product}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Grafik ini menunjukkan persebaran status video dari total keseluruhan video pada setiap minggunya beserta persentasenya.
            </p>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={productData.weeks} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    formatter={(value, name, props) => {
                      const totalReady = props.payload.ready;
                      const totalInQueue = props.payload.inQueue;
                      const totalVideo = props.payload.totalVideo;
                      
                      let pct = 0;
                      if (name === 'Learning') {
                        pct = totalInQueue > 0 ? ((value / totalInQueue) * 100).toFixed(1) : 0;
                      } else if (name === 'Not Active') {
                        pct = totalVideo > 0 ? ((value / totalVideo) * 100).toFixed(1) : 0;
                      } else {
                        pct = totalReady > 0 ? ((value / totalReady) * 100).toFixed(1) : 0;
                      }
                      
                      return [`${formatNumber(value)} (${pct}%)`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="notActive" name="Not Active" stackId="a" fill="#9ca3af" radius={[0, 0, 4, 4]} maxBarSize={80}>
                    <LabelList content={(props) => renderBarLabel(props, 'notActivePctOfTotal')} />
                  </Bar>
                  <Bar dataKey="delivering" name="Delivering (Tayang)" stackId="a" fill="var(--success-color)" radius={0} maxBarSize={80}>
                    <LabelList content={(props) => renderBarLabel(props, 'deliveringPct')} />
                  </Bar>
                  <Bar dataKey="learning" name="Learning" stackId="a" fill="#3b82f6" maxBarSize={80}>
                    <LabelList content={(props) => renderBarLabel(props, 'learningPct')} />
                  </Bar>
                  <Bar dataKey="inQueue" name="In Queue" stackId="a" fill="var(--warning-color)" maxBarSize={80}>
                    <LabelList content={(props) => renderBarLabel(props, 'inQueuePct')} />
                  </Bar>
                  <Bar dataKey="rejected" name="Rejected (Ban)" stackId="a" fill="var(--danger-color)" radius={[4, 4, 0, 0]} maxBarSize={80}>
                    <LabelList content={(props) => renderBarLabel(props, 'rejectedPct')} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ overflowX: 'auto', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', padding: '24px 24px 16px', margin: 0, color: 'var(--text-primary)' }}>
              Analisis Growth & Funnel - {productData.product}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-secondary)' }}>Minggu</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Video</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Ready (%)</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Not Active (%)</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>In Queue (%)</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Learning (%)</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Delivering (%)</th>
                  <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-secondary)' }}>Rejected (%) & Growth</th>
                </tr>
              </thead>
              <tbody>
                {productData.weeks.map((w, idx) => {
                  const isBanWave = w.rejectedGrowth > 20; // Highlight if rejection grew by > 20% compared to previous week
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: '600' }}>{w.week}</td>
                      <td style={{ padding: '16px' }}>{formatNumber(w.totalVideo)}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatNumber(w.ready)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{w.readyPctOfTotal.toFixed(1)}%</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatNumber(w.notActive)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{w.notActivePctOfTotal.toFixed(1)}%</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '500', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> {formatNumber(w.inQueue)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{w.inQueuePct.toFixed(1)}%</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '500', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <BookOpen size={14} /> {formatNumber(w.learning)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{w.learningPct.toFixed(1)}%</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> {formatNumber(w.delivering)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{w.deliveringPct.toFixed(1)}%</div>
                        {idx > 0 && (
                          <div style={{ fontSize: '0.75rem', marginTop: '4px', color: w.deliveringGrowth >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                            {w.deliveringGrowth > 0 ? '+' : ''}{w.deliveringGrowth.toFixed(1)}% vs Prev
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={14} /> {formatNumber(w.rejected)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{w.rejectedPct.toFixed(1)}%</div>
                        {idx > 0 && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            marginTop: '4px', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            display: 'inline-block',
                            backgroundColor: isBanWave ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            color: w.rejectedGrowth >= 0 ? 'var(--danger-color)' : 'var(--success-color)',
                            fontWeight: isBanWave ? '600' : 'normal'
                          }}>
                            {isBanWave && <AlertTriangle size={10} style={{ display: 'inline', marginRight: '2px' }} />}
                            {w.rejectedGrowth > 0 ? '+' : ''}{w.rejectedGrowth.toFixed(1)}% vs Prev
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ContentDistTab;
