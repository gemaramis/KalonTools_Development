import React from 'react';

const formatRp = (v) => {
  const num = Math.round(v);
  if (num >= 1000000000) return `Rp${(num / 1000000000).toFixed(1)} M`;
  if (num >= 1000000) return `Rp${(num / 1000000).toFixed(1)} Jt`;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

const formatNumber = (v) => {
  return new Intl.NumberFormat('id-ID').format(Math.round(v));
};

const HealthBar = ({ current, max, label, color = "var(--primary-color)", isDataHidden, formatter = formatRp }) => {
  const displayCurrent = isDataHidden ? '***' : formatter(current);
  const displayMax = isDataHidden ? '***' : formatter(max);
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : (isDataHidden ? 0 : 100);
  const isOver = max > 0 && current > max;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
        <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: '600' }}>{displayCurrent}</span>
          {(max > 0 || isDataHidden) && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>/ {displayMax}</span>
          )}
        </div>
      </div>
      <div style={{ 
        width: '100%', 
        height: '16px', 
        backgroundColor: 'var(--border-color)', 
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ 
          width: `${pct}%`, 
          height: '100%', 
          backgroundColor: isOver ? 'var(--danger-color)' : color,
          borderRadius: '8px',
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>
      {max > 0 && (
        <div style={{ fontSize: '0.75rem', color: isOver ? 'var(--danger-color)' : 'var(--text-secondary)', marginTop: '4px', textAlign: 'right' }}>
          {((current / max) * 100).toFixed(1)}% {isOver ? '(Over Target)' : ''}
        </div>
      )}
    </div>
  );
};

const TargetPlanningTab = ({ targetPlanningData, isDataHidden }) => {
  if (!targetPlanningData || targetPlanningData.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Memuat data Target & Planning...
      </div>
    );
  }

  const validMonths = targetPlanningData.filter(d => 
    d.targetAdsCost > 0 || d.spending > 0 || d.targetGmv > 0 || d.gmv > 0 || d.ttamCost > 0 || d.kolCost > 0
  );

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Target & Planning (Timeline)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Pantau progres pencapaian GMV dan serapan anggaran marketing bulanan.
        </p>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', gap: '24px', paddingBottom: '16px' }} className="hide-scrollbar">
        {validMonths.map((data, idx) => (
          <div key={idx} style={{ 
            minWidth: '320px', 
            backgroundColor: 'var(--bg-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--primary-color)' }}>{data.month}</h3>
            </div>
            
            <HealthBar 
              label="GMV vs Target" 
              current={data.gmv} 
              max={data.targetGmv} 
              color="#3b82f6" 
              isDataHidden={isDataHidden}
            />

            <HealthBar 
              label="Ads Cost vs Target Max" 
              current={data.spending} 
              max={data.targetAdsCost} 
              color="var(--success-color)" 
              isDataHidden={isDataHidden}
            />

            <HealthBar 
              label="TTAM Cost" 
              current={data.ttamCost} 
              max={isDataHidden ? 0 : 80000000} 
              color="#8b5cf6" 
              isDataHidden={isDataHidden}
            />

            <HealthBar 
              label="KOL Cost" 
              current={data.kolCost} 
              max={isDataHidden ? 0 : 500000000} 
              color="#ec4899" 
              isDataHidden={isDataHidden}
            />

            <HealthBar 
              label="New Consideration" 
              current={data.newConsideration || 0} 
              max={isDataHidden ? 0 : 228571} 
              color="#f59e0b" 
              isDataHidden={isDataHidden}
              formatter={formatNumber}
            />

            <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }}></div>

            <HealthBar 
              label="Total Cost vs Target" 
              current={data.spending + data.ttamCost + data.kolCost} 
              max={isDataHidden ? 0 : (data.targetAdsCost + 80000000 + 500000000)} 
              color="var(--warning-color)" 
              isDataHidden={isDataHidden}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TargetPlanningTab;
