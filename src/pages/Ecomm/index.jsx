import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../../context/SettingsContext';
import { useEcommerceData } from '../../hooks/useEcommerceData';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  subDays, isSameDay, isWithinInterval, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, format, isAfter, isBefore, eachDayOfInterval
} from 'date-fns';
import { Calendar, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Minus, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import EcommDateRangePicker from '../../components/DatePicker/EcommDateRangePicker';
import ColumnHeader from '../../components/Table/ColumnHeader';

// --- Helper Functions ---
const formatRp = (value) => {
  if (value >= 1000000000) return `Rp${(value / 1000000000).toFixed(1).replace('.0', '')} M`;
  if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1).replace('.0', '')} Jt`;
  if (value >= 1000) return `Rp${(value / 1000).toFixed(1).replace('.0', '')} rb`;
  return `Rp${value}`;
};

const formatRpFull = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value).replace(/,00$/, '');
};

const formatRpDetail = (value) => {
  return formatRpFull(value);
};

const formatNumber = (value) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1).replace('.0', '')} M`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')} Jt`;
  return new Intl.NumberFormat('id-ID').format(value);
};

const formatNumberFull = (value) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

const getDateRange = (rangeType, baseDate = new Date()) => {
  const end = baseDate;
  let start = baseDate;
  
  switch(rangeType) {
    case 'Hari Ini':
      start = baseDate;
      break;
    case 'Kemarin':
      start = subDays(baseDate, 1);
      return { start, end: start }; // Yesterday is just one day
    case '7 Hari Terakhir':
      start = subDays(baseDate, 6);
      break;
    case '30 Hari Terakhir':
      start = subDays(baseDate, 29);
      break;
    case 'Week 1': {
      const startMo = startOfMonth(baseDate);
      return { start: startMo, end: new Date(startMo.getFullYear(), startMo.getMonth(), 7) };
    }
    case 'Week 2': {
      const startMo = startOfMonth(baseDate);
      return { start: new Date(startMo.getFullYear(), startMo.getMonth(), 8), end: new Date(startMo.getFullYear(), startMo.getMonth(), 14) };
    }
    case 'Week 3': {
      const startMo = startOfMonth(baseDate);
      return { start: new Date(startMo.getFullYear(), startMo.getMonth(), 15), end: new Date(startMo.getFullYear(), startMo.getMonth(), 21) };
    }
    case 'Week 4': {
      const startMo = startOfMonth(baseDate);
      return { start: new Date(startMo.getFullYear(), startMo.getMonth(), 22), end: endOfMonth(baseDate) };
    }
    default:
      start = subDays(baseDate, 6);
  }
  return { start, end };
};

const filterDataByRange = (data, range) => {
  return data.filter(item => {
    return (isAfter(item.dateObj, range.start) || isSameDay(item.dateObj, range.start)) && 
           (isBefore(item.dateObj, range.end) || isSameDay(item.dateObj, range.end));
  });
};

const calculateTotal = (data, field) => data.reduce((sum, item) => sum + item[field], 0);

const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const ChangeIndicator = ({ current, previous }) => {
  const pct = calculateChange(current, previous);
  if (pct === 0) {
    return <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}><Minus size={12} style={{ marginRight: '2px' }}/> 0%</span>;
  }
  const isPositive = pct > 0;
  return (
    <span style={{ color: isPositive ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
      {isPositive ? <TrendingUp size={12} style={{ marginRight: '2px' }}/> : <TrendingDown size={12} style={{ marginRight: '2px' }}/>}
      {Math.abs(pct).toFixed(2).replace('.00', '')}%
    </span>
  );
};

// --- Main Component ---
const Ecomm = () => {
  const { globalSettings } = useSettings();
  const { mainData, detailData, loading, error } = useEcommerceData(
    globalSettings?.ecommLink, 
    globalSettings?.ecommDetailLink,
    globalSettings?.adsLink
  );

  const [activeTab, setActiveTab] = useState('Overview');
  const [skuSelectedMetric, setSkuSelectedMetric] = useState('gmv');
  const [skuSearchQuery, setSkuSearchQuery] = useState('');
  const [skuSortConfig, setSkuSortConfig] = useState({ key: 'current', direction: 'desc' });
  const [skuFilters, setSkuFilters] = useState({});
  const [selectedMetrics, setSelectedMetrics] = useState(['gmv', 'productsSold']);
  const [isCompareEnabled, setIsCompareEnabled] = useState(false);

  // Base date for "Today" simulation based on data if needed
  const maxDate = useMemo(() => {
    const validData = mainData.filter(d => d.gmv > 0 || d.grossRevenue > 0 || d.cost > 0 || d.impressionsTotal > 0);
    if (!validData.length) return new Date();
    return new Date(Math.max(...validData.map(d => d.dateObj.getTime())));
  }, [mainData]);

  const [currentRange, setCurrentRange] = useState({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const [compareRange, setCompareRange] = useState({
    start: subDays(new Date(), 13),
    end: subDays(new Date(), 7)
  });

  const [tooltipState, setTooltipState] = useState(null);

  // Update defaults once maxDate is available (if historical data)
  useEffect(() => {
    if (mainData.length > 0) {
      setCurrentRange({
        start: subDays(maxDate, 6),
        end: maxDate
      });
      setCompareRange({
        start: subDays(maxDate, 13),
        end: subDays(maxDate, 7)
      });
    }
  }, [maxDate, mainData.length]);

  const currentData = useMemo(() => filterDataByRange(mainData, currentRange), [mainData, currentRange]);
  const compareData = useMemo(() => filterDataByRange(mainData, compareRange), [mainData, compareRange]);

  const ecommMetricsInfo = [
    { id: 'gmv', label: 'GMV', format: formatRp, fullFormat: formatRpFull },
    { id: 'productsSold', label: 'Produk terjual', format: formatNumber, fullFormat: formatNumberFull },
    { id: 'impressionsTotal', label: 'Total Impresi', format: formatNumber, fullFormat: formatNumberFull },
    { id: 'impressionsShopTab', label: 'Impresi Shop', format: formatNumber, fullFormat: formatNumberFull },
    { id: 'impressionsLive', label: 'Impresi Live', format: formatNumber, fullFormat: formatNumberFull },
    { id: 'impressionsVideo', label: 'Impresi Video', format: formatNumber, fullFormat: formatNumberFull },
    { id: 'impressionsProductCard', label: 'Impresi Kartu Produk', format: formatNumber, fullFormat: formatNumberFull },
  ];

  const adsMetricsInfo = [
    { id: 'skuOrders', label: 'SKU Orders', format: formatNumber, fullFormat: formatNumberFull },
    { id: 'grossRevenue', label: 'Gross Revenue', format: formatRp, fullFormat: formatRpFull },
    { id: 'cost', label: 'Cost', format: formatRp, fullFormat: formatRpFull },
    { id: 'roi', label: 'ROI', format: (v) => `${v.toFixed(2)}`, fullFormat: (v) => `${v.toFixed(2)}` },
  ];

  const metricsInfo = [...ecommMetricsInfo, ...adsMetricsInfo];

  const handleMetricToggle = (metricId) => {
    if (selectedMetrics.includes(metricId)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(prev => prev.filter(m => m !== metricId));
      }
    } else {
      if (selectedMetrics.length < 4) {
        setSelectedMetrics(prev => [...prev, metricId]);
      } else {
        // Replace the oldest selection if 4 are already selected
        setSelectedMetrics(prev => [...prev.slice(1), metricId]);
      }
    }
  };

  // Process data for Chart
  const chartData = useMemo(() => {
    const currentSums = {};
    currentData.forEach(item => {
      const dateStr = format(item.dateObj, 'yyyy-MM-dd');
      if (!currentSums[dateStr]) currentSums[dateStr] = { gmv: 0, productsSold: 0, impressionsTotal: 0, impressionsShopTab: 0, impressionsLive: 0, impressionsVideo: 0, impressionsProductCard: 0, skuOrders: 0, grossRevenue: 0, cost: 0, roi: 0, roiCount: 0 };
      currentSums[dateStr].gmv += item.gmv || 0;
      currentSums[dateStr].productsSold += item.productsSold || 0;
      currentSums[dateStr].impressionsTotal += item.impressionsTotal || 0;
      currentSums[dateStr].impressionsShopTab += item.impressionsShopTab || 0;
      currentSums[dateStr].impressionsLive += item.impressionsLive || 0;
      currentSums[dateStr].impressionsVideo += item.impressionsVideo || 0;
      currentSums[dateStr].impressionsProductCard += item.impressionsProductCard || 0;
      currentSums[dateStr].skuOrders += item.skuOrders || 0;
      currentSums[dateStr].grossRevenue += item.grossRevenue || 0;
      currentSums[dateStr].cost += item.cost || 0;
      if (item.roi) {
        currentSums[dateStr].roi += item.roi;
        currentSums[dateStr].roiCount += 1;
      }
    });

    const compareSums = {};
    compareData.forEach(item => {
      const dateStr = format(item.dateObj, 'yyyy-MM-dd');
      if (!compareSums[dateStr]) compareSums[dateStr] = { gmv: 0, productsSold: 0, impressionsTotal: 0, impressionsShopTab: 0, impressionsLive: 0, impressionsVideo: 0, impressionsProductCard: 0, skuOrders: 0, grossRevenue: 0, cost: 0, roi: 0, roiCount: 0 };
      compareSums[dateStr].gmv += item.gmv || 0;
      compareSums[dateStr].productsSold += item.productsSold || 0;
      compareSums[dateStr].impressionsTotal += item.impressionsTotal || 0;
      compareSums[dateStr].impressionsShopTab += item.impressionsShopTab || 0;
      compareSums[dateStr].impressionsLive += item.impressionsLive || 0;
      compareSums[dateStr].impressionsVideo += item.impressionsVideo || 0;
      compareSums[dateStr].impressionsProductCard += item.impressionsProductCard || 0;
      compareSums[dateStr].skuOrders += item.skuOrders || 0;
      compareSums[dateStr].grossRevenue += item.grossRevenue || 0;
      compareSums[dateStr].cost += item.cost || 0;
      if (item.roi) {
        compareSums[dateStr].roi += item.roi;
        compareSums[dateStr].roiCount += 1;
      }
    });

    const currentDays = eachDayOfInterval({ start: currentRange.start, end: currentRange.end });
    const compareDays = eachDayOfInterval({ start: compareRange.start, end: compareRange.end });
    
    const maxLength = Math.max(currentDays.length, compareDays.length);
    const result = [];

    for (let i = 0; i < maxLength; i++) {
      const cDay = currentDays[i];
      const pDay = compareDays[i];

      const cKey = cDay ? format(cDay, 'yyyy-MM-dd') : null;
      const pKey = pDay ? format(pDay, 'yyyy-MM-dd') : null;

      const cVals = cKey && currentSums[cKey] ? currentSums[cKey] : {};
      const pVals = pKey && compareSums[pKey] ? compareSums[pKey] : {};

      const dataPoint = {
        date: cDay ? format(cDay, 'MMM d') : `Day ${i+1}`,
      };

      metricsInfo.forEach(m => {
        dataPoint[m.id] = cVals[m.id] ? (m.id === 'roi' ? (cVals.roiCount ? cVals.roi / cVals.roiCount : 0) : cVals[m.id]) : 0;
        dataPoint[`${m.id}Compare`] = pVals[m.id] ? (m.id === 'roi' ? (pVals.roiCount ? pVals.roi / pVals.roiCount : 0) : pVals[m.id]) : 0;
      });

      result.push(dataPoint);
    }
    return result;
  }, [currentData, compareData, currentRange, compareRange]);

  const CHART_COLORS = ['#00B5A5', '#3B82F6', '#F59E0B', '#8B5CF6'];

  // Detail GMV Logic
  // Find which week the currentRange mostly falls into
  const currentWeekNum = useMemo(() => {
    const day = currentRange.start.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  }, [currentRange]);

  const compareWeekNum = useMemo(() => {
    const day = compareRange.start.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  }, [compareRange]);

  const currentMonthName = useMemo(() => {
    return format(currentRange.start, 'MMMM');
  }, [currentRange]);

  // Helper for detail aggregation
  const aggregateDetailData = (weekNum) => {
    const filterDetail = (dataArray) => {
      const matched = dataArray.filter(d => d.week === weekNum);
      const targetData = matched.length > 0 ? matched : dataArray;
      
      return targetData.reduce((acc, curr) => {
        acc.affiliate += curr.affiliate;
        acc.seller += curr.seller;
        acc.total += (curr.affiliate + curr.seller);
        return acc;
      }, { affiliate: 0, seller: 0, total: 0 });
    };

    const live = filterDetail(detailData.live);
    const video = filterDetail(detailData.video);
    const productCard = filterDetail(detailData.productCard);
    const totalGMV = live.total + video.total + productCard.total;

    return {
      total: totalGMV,
      live: { ...live, pct: totalGMV ? (live.total / totalGMV) * 100 : 0 },
      video: { ...video, pct: totalGMV ? (video.total / totalGMV) * 100 : 0 },
      productCard: { ...productCard, pct: totalGMV ? (productCard.total / totalGMV) * 100 : 0 }
    };
  };

  const aggregatedDetail = useMemo(() => aggregateDetailData(currentWeekNum), [detailData, currentWeekNum]);
  const compareAggregatedDetail = useMemo(() => aggregateDetailData(compareWeekNum), [detailData, compareWeekNum]);

  // --- SKU Data Aggregation ---
  const skuTableData = useMemo(() => {
    if (activeTab !== 'SKU Data') return [];

    const productMap = {};

    const getMetricValue = (item) => {
      return item[skuSelectedMetric] || 0;
    };

    currentData.forEach(item => {
      const prod = item.product || 'Unknown';
      if (!productMap[prod]) productMap[prod] = { name: prod, current: 0, compare: 0 };
      productMap[prod].current += getMetricValue(item);
    });

    compareData.forEach(item => {
      const prod = item.product || 'Unknown';
      if (!productMap[prod]) productMap[prod] = { name: prod, current: 0, compare: 0 };
      productMap[prod].compare += getMetricValue(item);
    });

    let result = Object.values(productMap);

    // Filter
    if (skuSearchQuery.trim()) {
      const q = skuSearchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }

    // Filter by Dropdowns
    Object.keys(skuFilters).forEach(key => {
      if (skuFilters[key]) {
        result = result.filter(item => item[key] === skuFilters[key]);
      }
    });

    // Sort
    result.sort((a, b) => {
      let valA = a[skuSortConfig.key];
      let valB = b[skuSortConfig.key];

      if (skuSortConfig.key === 'change') {
        const getChange = (p) => p.current === 0 ? (p.compare > 0 ? 100 : 0) : ((p.compare - p.current) / p.current) * 100;
        valA = getChange(a);
        valB = getChange(b);
      }

      if (valA < valB) return skuSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return skuSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [activeTab, currentData, compareData, skuSelectedMetric, skuSearchQuery, skuSortConfig]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (skuSortConfig.key === key && skuSortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSkuSortConfig({ key, direction });
  };

  const handleSkuFilterChange = (key, value) => {
    setSkuFilters(prev => ({ ...prev, [key]: value }));
  };

  const PIE_COLORS = ['#00B5A5', '#F59E0B', '#3B82F6'];
  const pieData = [
    { name: 'LIVE', value: aggregatedDetail.live.total },
    { name: 'Video', value: aggregatedDetail.video.total },
    { name: 'Kartu produk', value: aggregatedDetail.productCard.total }
  ];

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading Ecommerce Data...</div>;
  }

  if (error) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--danger-color)' }}>Error: {error}</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header and Tabs */}
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>Ecommerce Data</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Kelola dan pantau performa Ecommerce (Tiktok Shop) Anda</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <div 
          onClick={() => setActiveTab('Overview')}
          style={{ 
            fontSize: '1.125rem', fontWeight: activeTab === 'Overview' ? '600' : '500', 
            color: activeTab === 'Overview' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer', paddingBottom: '12px', position: 'relative'
          }}>
          Overview
          {activeTab === 'Overview' && <div style={{ position: 'absolute', bottom: '-1px', left: 0, width: '100%', height: '2px', backgroundColor: 'var(--primary-color)' }}></div>}
        </div>
        <div 
          onClick={() => setActiveTab('SKU Data')}
          style={{ 
            fontSize: '1.125rem', fontWeight: activeTab === 'SKU Data' ? '600' : '500', 
            color: activeTab === 'SKU Data' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer', paddingBottom: '12px', position: 'relative'
          }}>
          SKU Data
          {activeTab === 'SKU Data' && <div style={{ position: 'absolute', bottom: '-1px', left: 0, width: '100%', height: '2px', backgroundColor: 'var(--primary-color)' }}></div>}
        </div>
      </div>

      {/* Top Bar Filters */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px' }}>
        <div className="flex-between">
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{activeTab === 'Overview' ? 'Metrik utama' : 'SKU Performance'}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EcommDateRangePicker range={currentRange} setRange={setCurrentRange} />
            </div>
            
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                <input 
                  type="checkbox" 
                  checked={isCompareEnabled} 
                  onChange={(e) => setIsCompareEnabled(e.target.checked)} 
                  style={{ cursor: 'pointer' }}
                />
                Aktifkan Perbandingan
              </label>
              {isCompareEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Bandingkan:</span>
                  <EcommDateRangePicker range={compareRange} setRange={setCompareRange} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div 
        style={{ display: activeTab === 'Overview' ? 'flex' : 'none', flexDirection: 'column', gap: '20px', paddingBottom: '8px' }}
      >
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ecommerce Metrics</p>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '8px', scrollbarWidth: 'thin' }} onScroll={() => setTooltipState(null)}>
            {ecommMetricsInfo.map(metric => {
              const currentVal = calculateTotal(currentData, metric.id);
              const compareVal = calculateTotal(compareData, metric.id);
              const change = calculateChange(currentVal, compareVal);
              const isSelected = selectedMetrics.includes(metric.id);
              const isPositive = change > 0;
              const isNeutral = change === 0;

              return (
                <div 
                  key={metric.id}
                  onClick={() => handleMetricToggle(metric.id)}
                  onMouseMove={(e) => {
                    setTooltipState({ x: e.clientX, y: e.clientY, label: metric.label, value: metric.fullFormat(currentVal) });
                  }}
                  onMouseLeave={() => setTooltipState(null)}
                  className="glass-panel" 
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${CHART_COLORS[selectedMetrics.indexOf(metric.id)]}` : '2px solid transparent',
                    backgroundColor: isSelected ? 'var(--surface-color)' : 'var(--bg-color)',
                    position: 'relative',
                    minWidth: '220px',
                    flexShrink: 0
                  }}
                >
                  <div style={{ position: 'absolute', top: '16px', left: 0, width: '4px', height: '24px', backgroundColor: isSelected ? CHART_COLORS[selectedMetrics.indexOf(metric.id)] : 'transparent' }}></div>
                  <div className="flex-between" style={{ marginBottom: '12px', paddingLeft: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{metric.label}</span>
                    <div style={{ 
                      width: '16px', height: '16px', 
                      borderRadius: '4px', 
                      border: `1px solid ${isSelected ? CHART_COLORS[selectedMetrics.indexOf(metric.id)] : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? CHART_COLORS[selectedMetrics.indexOf(metric.id)] : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                    </div>
                  </div>
                  <div style={{ paddingLeft: '12px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                      {metric.format(currentVal)}
                    </span>
                    {isCompareEnabled && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        color: isNeutral ? 'var(--text-secondary)' : isPositive ? 'var(--success-color)' : 'var(--danger-color)',
                        display: 'flex', alignItems: 'center', marginBottom: '4px'
                      }}>
                        {isNeutral ? <Minus size={12} style={{ marginRight: '2px' }}/> : isPositive ? <TrendingUp size={12} style={{ marginRight: '2px' }}/> : <TrendingDown size={12} style={{ marginRight: '2px' }}/>}
                        {Math.abs(change).toFixed(2).replace('.00', '')}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ads Metrics</p>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '8px', scrollbarWidth: 'thin' }} onScroll={() => setTooltipState(null)}>
            {adsMetricsInfo.map(metric => {
              const currentVal = metric.id === 'roi' ? (currentData.reduce((s,i)=>s+i.roi,0)/(currentData.filter(i=>i.roi).length||1)) : calculateTotal(currentData, metric.id);
              const compareVal = metric.id === 'roi' ? (compareData.reduce((s,i)=>s+i.roi,0)/(compareData.filter(i=>i.roi).length||1)) : calculateTotal(compareData, metric.id);
              const change = calculateChange(currentVal, compareVal);
              const isSelected = selectedMetrics.includes(metric.id);
              const isPositive = change > 0;
              const isNeutral = change === 0;

              return (
                <div 
                  key={metric.id}
                  onClick={() => handleMetricToggle(metric.id)}
                  onMouseMove={(e) => {
                    setTooltipState({ x: e.clientX, y: e.clientY, label: metric.label, value: metric.fullFormat(currentVal) });
                  }}
                  onMouseLeave={() => setTooltipState(null)}
                  className="glass-panel" 
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${CHART_COLORS[selectedMetrics.indexOf(metric.id)]}` : '2px solid transparent',
                    backgroundColor: isSelected ? 'var(--surface-color)' : 'var(--bg-color)',
                    position: 'relative',
                    minWidth: '220px',
                    flexShrink: 0
                  }}
                >
                  <div style={{ position: 'absolute', top: '16px', left: 0, width: '4px', height: '24px', backgroundColor: isSelected ? CHART_COLORS[selectedMetrics.indexOf(metric.id)] : 'transparent' }}></div>
                  <div className="flex-between" style={{ marginBottom: '12px', paddingLeft: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{metric.label}</span>
                    <div style={{ 
                      width: '16px', height: '16px', 
                      borderRadius: '4px', 
                      border: `1px solid ${isSelected ? CHART_COLORS[selectedMetrics.indexOf(metric.id)] : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? CHART_COLORS[selectedMetrics.indexOf(metric.id)] : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                    </div>
                  </div>
                  <div style={{ paddingLeft: '12px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                      {metric.format(currentVal)}
                    </span>
                    {isCompareEnabled && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        color: isNeutral ? 'var(--text-secondary)' : isPositive ? 'var(--success-color)' : 'var(--danger-color)',
                        display: 'flex', alignItems: 'center', marginBottom: '4px'
                      }}>
                        {isNeutral ? <Minus size={12} style={{ marginRight: '2px' }}/> : isPositive ? <TrendingUp size={12} style={{ marginRight: '2px' }}/> : <TrendingDown size={12} style={{ marginRight: '2px' }}/>}
                        {Math.abs(change).toFixed(2).replace('.00', '')}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="glass-panel" style={{ padding: '24px', display: activeTab === 'Overview' ? 'block' : 'none' }}>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} dy={10} />
              
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} 
                axisLine={false} tickLine={false} 
                tickFormatter={(val) => {
                  if (val >= 1000000) return `Rp${(val / 1000000).toFixed(0)} jt`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
                  return val;
                }}
              />
              
              {selectedMetrics.length > 1 && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} 
                  axisLine={false} tickLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
                    return val;
                  }}
                />
              )}
              
              <Tooltip 
                formatter={(value, name) => {
                  const isRp = name.includes('GMV');
                  return [isRp ? formatRpFull(value) : formatNumberFull(value), name];
                }}
                contentStyle={{ backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontSize: '0.875rem', fontWeight: '500' }}
                labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{ fontSize: '0.875rem', paddingBottom: '16px' }}/>
              
              {selectedMetrics.map((metricId, index) => (
                <React.Fragment key={metricId}>
                  <Line 
                    yAxisId={index % 2 === 0 ? "left" : "right"}
                    type="monotone" 
                    dataKey={metricId} 
                    name={metricsInfo.find(m => m.id === metricId).label}
                    stroke={CHART_COLORS[index]} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  {isCompareEnabled && (
                    <Line 
                      yAxisId={index % 2 === 0 ? "left" : "right"}
                      type="monotone" 
                      dataKey={`${metricId}Compare`} 
                      name={`${metricsInfo.find(m => m.id === metricId).label} (Bandingkan)`}
                      stroke={CHART_COLORS[index]} 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      strokeOpacity={0.4}
                      dot={false}
                      activeDot={false}
                    />
                  )}
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail GMV */}
      <div className="glass-panel" style={{ padding: '24px', display: activeTab === 'Overview' ? 'block' : 'none' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Detail GMV</h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Terakhir di update {currentMonthName} Week {currentWeekNum}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px', alignItems: 'center' }}>
          {/* Donut Chart */}
          <div style={{ position: 'relative', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>GMV</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{formatRpDetail(aggregatedDetail.total)}</div>
            </div>
            
            {/* Legend inside Donut Area */}
            <div style={{ position: 'absolute', top: '50%', right: '-40px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '80px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PIE_COLORS[0] }}></div> LIVE</div>
                <div style={{ fontWeight: '600' }}>{aggregatedDetail.live.pct.toFixed(1)}%</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '80px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PIE_COLORS[1] }}></div> Video</div>
                <div style={{ fontWeight: '600' }}>{aggregatedDetail.video.pct.toFixed(1)}%</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '80px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PIE_COLORS[2] }}></div> Kartu produk</div>
                <div style={{ fontWeight: '600' }}>{aggregatedDetail.productCard.pct.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* List Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            
            {/* LIVE Row */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronDown size={16} color="var(--text-secondary)" />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PIE_COLORS[0] }}></div>
                  <span style={{ fontWeight: '600' }}>LIVE</span>
                  <a href="#" style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}>Lihat analisis</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '600' }}>{formatRpDetail(aggregatedDetail.live.total)}</span>
                  <ChangeIndicator current={aggregatedDetail.live.total} previous={compareAggregatedDetail.live.total} />
                </div>
              </div>
              <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex-between">
                  <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronRight size={14} color="var(--text-secondary)" />
                    Afiliasi <span style={{ color: 'var(--text-secondary)' }}>(Kontribusi {aggregatedDetail.live.total ? ((aggregatedDetail.live.affiliate / aggregatedDetail.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{formatRpDetail(aggregatedDetail.live.affiliate)}</span>
                    <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                      <ChangeIndicator current={aggregatedDetail.live.affiliate} previous={compareAggregatedDetail.live.affiliate} />
                    </div>
                  </div>
                </div>
                <div className="flex-between">
                  <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronRight size={14} color="var(--text-secondary)" />
                    Penjual <span style={{ color: 'var(--text-secondary)' }}>(Kontribusi {aggregatedDetail.live.total ? ((aggregatedDetail.live.seller / aggregatedDetail.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{formatRpDetail(aggregatedDetail.live.seller)}</span>
                    <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                      <ChangeIndicator current={aggregatedDetail.live.seller} previous={compareAggregatedDetail.live.seller} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Row */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronDown size={16} color="var(--text-secondary)" />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PIE_COLORS[1] }}></div>
                  <span style={{ fontWeight: '600' }}>Video</span>
                  <a href="#" style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}>Lihat analisis</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '600' }}>{formatRpDetail(aggregatedDetail.video.total)}</span>
                  <ChangeIndicator current={aggregatedDetail.video.total} previous={compareAggregatedDetail.video.total} />
                </div>
              </div>
              <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex-between">
                  <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronRight size={14} color="var(--text-secondary)" />
                    Afiliasi <span style={{ color: 'var(--text-secondary)' }}>(Kontribusi {aggregatedDetail.total ? ((aggregatedDetail.video.affiliate / aggregatedDetail.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{formatRpDetail(aggregatedDetail.video.affiliate)}</span>
                    <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                      <ChangeIndicator current={aggregatedDetail.video.affiliate} previous={compareAggregatedDetail.video.affiliate} />
                    </div>
                  </div>
                </div>
                <div className="flex-between">
                  <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronRight size={14} color="var(--text-secondary)" />
                    Penjual <span style={{ color: 'var(--text-secondary)' }}>(Kontribusi {aggregatedDetail.total ? ((aggregatedDetail.video.seller / aggregatedDetail.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{formatRpDetail(aggregatedDetail.video.seller)}</span>
                    <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                      <ChangeIndicator current={aggregatedDetail.video.seller} previous={compareAggregatedDetail.video.seller} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kartu Produk Row */}
            <div style={{ paddingBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronDown size={16} color="var(--text-secondary)" />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PIE_COLORS[2] }}></div>
                  <span style={{ fontWeight: '600' }}>Kartu produk</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '600' }}>{formatRpDetail(aggregatedDetail.productCard.total)}</span>
                  <ChangeIndicator current={aggregatedDetail.productCard.total} previous={compareAggregatedDetail.productCard.total} />
                </div>
              </div>
              <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex-between">
                  <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronRight size={14} color="var(--text-secondary)" />
                    Afiliasi <span style={{ color: 'var(--text-secondary)' }}>(Kontribusi {aggregatedDetail.total ? ((aggregatedDetail.productCard.affiliate / aggregatedDetail.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{formatRpDetail(aggregatedDetail.productCard.affiliate)}</span>
                    <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                      <ChangeIndicator current={aggregatedDetail.productCard.affiliate} previous={compareAggregatedDetail.productCard.affiliate} />
                    </div>
                  </div>
                </div>
                <div className="flex-between">
                  <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronRight size={14} color="var(--text-secondary)" />
                    Penjual <span style={{ color: 'var(--text-secondary)' }}>(Kontribusi {aggregatedDetail.total ? ((aggregatedDetail.productCard.seller / aggregatedDetail.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{formatRpDetail(aggregatedDetail.productCard.seller)}</span>
                    <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                      <ChangeIndicator current={aggregatedDetail.productCard.seller} previous={compareAggregatedDetail.productCard.seller} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SKU Data Tab Content */}
      <div style={{ display: activeTab === 'SKU Data' ? 'block' : 'none' }} className="animation-fade-in">
        <div className="flex-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          {/* SKU Metric Selector */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '8px' }}>Pilih Metrik (max 1):</span>
            {metricsInfo.map(metric => (
              <button
                key={metric.id}
                onClick={() => setSkuSelectedMetric(metric.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: `1px solid ${skuSelectedMetric === metric.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  backgroundColor: skuSelectedMetric === metric.id ? 'rgba(0, 181, 165, 0.1)' : 'transparent',
                  color: skuSelectedMetric === metric.id ? 'var(--primary-color)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: skuSelectedMetric === metric.id ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {metric.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Cari produk..." 
              value={skuSearchQuery}
              onChange={(e) => setSkuSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 16px 10px 38px',
                borderRadius: '8px', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)',
                outline: 'none', transition: 'border-color 0.2s'
              }}
            />
          </div>
        </div>

        {/* SKU Table */}
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>No</th>
                <ColumnHeader 
                  label="Product Name" 
                  sortKey="name" 
                  sortConfig={skuSortConfig} 
                  onSort={handleSort} 
                  filterValue={skuFilters.name} 
                  onFilterChange={handleSkuFilterChange} 
                  options={Array.from(new Set(currentData.map(d => d.product).filter(Boolean))).sort()}
                />
                <ColumnHeader 
                  label={`Date A (${format(currentRange.start, 'dd/MM/yy')} - ${format(currentRange.end, 'dd/MM/yy')})`} 
                  sortKey="current" 
                  sortConfig={skuSortConfig} 
                  onSort={handleSort}
                />
                <ColumnHeader 
                  label={`Date B (${format(compareRange.start, 'dd/MM/yy')} - ${format(compareRange.end, 'dd/MM/yy')})`} 
                  sortKey="compare" 
                  sortConfig={skuSortConfig} 
                  onSort={handleSort}
                />
                <ColumnHeader 
                  label="Changes %" 
                  sortKey="change" 
                  sortConfig={skuSortConfig} 
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {skuTableData.map((row, index) => {
                const metricInfo = metricsInfo.find(m => m.id === skuSelectedMetric);
                const formatFn = metricInfo ? metricInfo.fullFormat : formatNumberFull;
                
                return (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px' }}>{index + 1}</td>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{row.name}</td>
                    <td style={{ padding: '16px' }}>{formatFn(row.current)}</td>
                    <td style={{ padding: '16px' }}>{formatFn(row.compare)}</td>
                    <td style={{ padding: '16px' }}>
                      <ChangeIndicator current={row.compare} previous={row.current} />
                    </td>
                  </tr>
                );
              })}
              {skuTableData.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada data tersedia</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Tooltip Portal */}
      {tooltipState && (() => {
        const isNearRightEdge = tooltipState.x + 220 > window.innerWidth;
        const leftPos = isNearRightEdge ? tooltipState.x - 8 : tooltipState.x + 12;
        const transform = isNearRightEdge ? 'translate(-100%, -50%)' : 'translateY(-50%)';
        const caretLeft = isNearRightEdge ? 'auto' : '-6px';
        const caretRight = isNearRightEdge ? '-6px' : 'auto';
        const caretBorders = isNearRightEdge 
          ? { borderRight: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)' }
          : { borderLeft: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' };

        return createPortal(
          <div style={{
            position: 'fixed',
            top: tooltipState.y,
            left: leftPos,
            transform: transform,
            backgroundColor: 'var(--surface-color)',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 9999,
            pointerEvents: 'none',
            border: '1px solid var(--border-color)',
            minWidth: '180px'
          }}>
            {/* Caret */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: caretLeft,
              right: caretRight,
              transform: 'translateY(-50%) rotate(45deg)',
              width: '12px',
              height: '12px',
              backgroundColor: 'var(--surface-color)',
              ...caretBorders
            }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>{tooltipState.label}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)' }}>{tooltipState.value}</div>
            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
};

export default Ecomm;
