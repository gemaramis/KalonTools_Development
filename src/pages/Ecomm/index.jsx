import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { Calendar, TrendingUp, TrendingDown, ChevronDown, ChevronRight, ChevronLeft, Minus, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import EcommDateRangePicker from '../../components/DatePicker/EcommDateRangePicker';
import ColumnHeader from '../../components/Table/ColumnHeader';
import ActionPlanNotes from '../../components/Ecomm/ActionPlanNotes';

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

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="0.75rem" fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
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
  const { globalSettings, getSettingsForMonth, updateMonthlySettings } = useSettings();
  const { mainData, detailData, loading, error } = useEcommerceData(
    globalSettings?.ecommLink, 
    globalSettings?.adsLink
  );

  const [activeTab, setActiveTab] = useState('Overview');
  const [skuSelectedMetric, setSkuSelectedMetric] = useState('gmv');
  const [skuSearchQuery, setSkuSearchQuery] = useState('');
  const [skuSortConfig, setSkuSortConfig] = useState({ key: 'current', direction: 'desc' });
  const [skuFilters, setSkuFilters] = useState({});
  const [skuSelectedProducts, setSkuSelectedProducts] = useState([]);
  const [skuCurrentPage, setSkuCurrentPage] = useState(1);
  const [selectedMetrics, setSelectedMetrics] = useState(['gmv', 'productsSold']);
  const [isCompareEnabled, setIsCompareEnabled] = useState(false);
  
  const scrollContainerEcommRef = useRef(null);
  const scrollContainerAdsRef = useRef(null);



  const scrollLeftEcomm = () => {
    if (scrollContainerEcommRef.current) {
      scrollContainerEcommRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };
  const scrollRightEcomm = () => {
    if (scrollContainerEcommRef.current) {
      scrollContainerEcommRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const scrollLeftAds = () => {
    if (scrollContainerAdsRef.current) {
      scrollContainerAdsRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };
  const scrollRightAds = () => {
    if (scrollContainerAdsRef.current) {
      scrollContainerAdsRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

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

  // Month tracking for Action Plan Notes
  const activeMonths = useMemo(() => {
    const monthNames = ['January', 'February', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    if (!currentRange.start) return [monthNames[new Date().getMonth()]];
    
    const start = new Date(currentRange.start);
    const end = currentRange.end ? new Date(currentRange.end) : new Date(currentRange.start);
    
    const result = [];
    const d = new Date(start);
    d.setDate(1); // Set to 1st of month to avoid overflow
    const endYearMonth = end.getFullYear() * 12 + end.getMonth();
    
    while (d.getFullYear() * 12 + d.getMonth() <= endYearMonth) {
      // Prevent duplicates in case of timezone/date shifting weirdness
      const mStr = monthNames[d.getMonth()];
      if (!result.includes(mStr)) result.push(mStr);
      d.setMonth(d.getMonth() + 1);
    }
    return result.length > 0 ? result : [monthNames[new Date().getMonth()]];
  }, [currentRange]);

  const [overviewSelectedSkus, setOverviewSelectedSkus] = useState([]);

  const toggleOverviewSku = (skuName) => {
    setOverviewSelectedSkus(prev => {
      if (prev.includes(skuName)) {
        return prev.filter(n => n !== skuName);
      }
      if (prev.length >= 5) {
        // Replace the oldest selected item
        return [...prev.slice(1), skuName];
      }
      return [...prev, skuName];
    });
  };

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

  // Detail GMV Logic (Smart Auto-Update based on Date Range)
  const aggregateDetailData = (range) => {
    const targetDate = range.start;
    const diffDays = (range.end - range.start) / (1000 * 60 * 60 * 24);
    const isFullMonth = diffDays >= 20; // If they select > 20 days, assume they want the full month
    
    let targetWeekNum = 0;
    if (!isFullMonth) {
      const day = targetDate.getDate();
      if (day <= 7) targetWeekNum = 1;
      else if (day <= 14) targetWeekNum = 2;
      else if (day <= 21) targetWeekNum = 3;
      else targetWeekNum = 4;
    }

    const filterDetail = (dataArray) => {
      // 1. Filter by Month
      let matched = dataArray.filter(d => {
        if (!d.month) return false;
        const dbM = d.month.toLowerCase();
        const mIdx = targetDate.getMonth();
        // Support 'Maret', 'March', 'April', 'May', 'Mei'
        const shortEn = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'][mIdx];
        const shortEnAlt = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][mIdx];
        return dbM.startsWith(shortEn) || dbM.startsWith(shortEnAlt) || dbM.includes(shortEn) || dbM.includes(shortEnAlt);
      });
      
      // 2. Filter by Week if not a full month
      if (!isFullMonth && targetWeekNum > 0) {
        matched = matched.filter(d => d.week === targetWeekNum);
      }
      
      return matched.reduce((acc, curr) => {
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
      isFullMonth,
      targetWeekNum,
      targetMonthIndex: targetDate.getMonth(),
      live: { ...live, pct: totalGMV ? (live.total / totalGMV) * 100 : 0 },
      video: { ...video, pct: totalGMV ? (video.total / totalGMV) * 100 : 0 },
      productCard: { ...productCard, pct: totalGMV ? (productCard.total / totalGMV) * 100 : 0 }
    };
  };

  const aggregatedDetail = useMemo(() => aggregateDetailData(currentRange), [detailData, currentRange]);
  const compareAggregatedDetail = useMemo(() => aggregateDetailData(compareRange), [detailData, compareRange]);

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

  const SKU_PIE_COLORS = ['#00B5A5', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B'];

  const skuPieData = useMemo(() => {
    if (!skuTableData || skuTableData.length === 0) return [];
    
    const sorted = [...skuTableData].sort((a, b) => b.current - a.current);
    const top = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((acc, curr) => acc + curr.current, 0);
    
    const result = top.map(p => ({ name: p.name, value: Math.max(0, p.current) }));
    if (others > 0) {
      result.push({ name: 'Lainnya', value: others });
    }
    // Filter out 0 values so the pie chart doesn't render empty slivers
    return result.filter(d => d.value > 0);
  }, [skuTableData]);

  const allOverviewSkus = useMemo(() => {
    const productMap = {};
    const compareProductMap = {};

    currentData.forEach(item => {
      const prod = item.product || 'Unknown';
      if (!productMap[prod]) productMap[prod] = 0;
      productMap[prod] += (item.gmv || 0);
    });

    compareData.forEach(item => {
      const prod = item.product || 'Unknown';
      if (!compareProductMap[prod]) compareProductMap[prod] = 0;
      compareProductMap[prod] += (item.gmv || 0);
    });
    
    return Object.entries(productMap)
      .map(([name, value]) => ({ name, value, compareValue: compareProductMap[name] || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [currentData, compareData]);

  const overviewSkuPieData = useMemo(() => {
    if (allOverviewSkus.length === 0) return [];
    
    const selectedNames = overviewSelectedSkus.length > 0 
      ? overviewSelectedSkus 
      : allOverviewSkus.slice(0, 5).map(s => s.name);
      
    let selectedItems = [];
    let othersValue = 0;
    let othersCompare = 0;
    
    allOverviewSkus.forEach(item => {
      if (selectedNames.includes(item.name)) {
        selectedItems.push(item);
      } else {
        othersValue += item.value;
        othersCompare += item.compareValue;
      }
    });
    
    // Sort selected items by value so the pie chart looks ordered
    selectedItems.sort((a, b) => b.value - a.value);
    
    const result = selectedItems.map(p => ({ 
      name: p.name, 
      value: Math.max(0, p.value), 
      compareValue: Math.max(0, p.compareValue) 
    }));
    
    if (othersValue > 0) {
      result.push({ 
        name: 'Lainnya', 
        value: Math.max(0, othersValue), 
        compareValue: Math.max(0, othersCompare) 
      });
    }
    
    return result.filter(d => d.value > 0);
  }, [allOverviewSkus, overviewSelectedSkus]);

  const paginatedSkuData = useMemo(() => {
    const startIndex = (skuCurrentPage - 1) * 10;
    return skuTableData.slice(startIndex, startIndex + 10);
  }, [skuTableData, skuCurrentPage]);
  const totalSkuPages = Math.ceil(skuTableData.length / 10);

  const productsToPlot = skuSelectedProducts.length > 0 
    ? skuSelectedProducts 
    : skuTableData.slice(0, 2).map(p => p.name);

  const skuChartData = useMemo(() => {
    if (productsToPlot.length === 0) return [];
    
    const currentDays = eachDayOfInterval({ start: currentRange.start, end: currentRange.end });
    const compareDays = eachDayOfInterval({ start: compareRange.start, end: compareRange.end });
    const maxDays = Math.max(currentDays.length, compareDays.length);
    
    const result = Array.from({ length: maxDays }).map((_, i) => {
      const dataPoint = {};
      const currDay = currentDays[i];
      if (currDay) dataPoint.date = format(currDay, 'MMM d');
      
      productsToPlot.forEach(prodName => {
        if (currDay) dataPoint[prodName] = 0;
        if (isCompareEnabled) dataPoint[`${prodName}Compare`] = 0;
      });
      return dataPoint;
    });

    currentData.forEach(item => {
      if (item.product && productsToPlot.includes(item.product)) {
        const dateStr = format(item.dateObj, 'MMM d');
        const dataPoint = result.find(d => d.date === dateStr);
        if (dataPoint) {
          dataPoint[item.product] += item[skuSelectedMetric] || 0;
        }
      }
    });

    if (isCompareEnabled) {
      compareData.forEach(item => {
        if (item.product && productsToPlot.includes(item.product)) {
          const dateStr = format(item.dateObj, 'yyyy-MM-dd');
          const dayIndex = compareDays.findIndex(d => format(d, 'yyyy-MM-dd') === dateStr);
          if (dayIndex !== -1 && result[dayIndex]) {
            result[dayIndex][`${item.product}Compare`] += item[skuSelectedMetric] || 0;
          }
        }
      });
    }

    return result;
  }, [currentData, compareData, currentRange, compareRange, productsToPlot, skuSelectedMetric, isCompareEnabled]);

  const handleSkuProductSelect = (productName) => {
    setSkuSelectedProducts(prev => {
      if (prev.includes(productName)) {
        return prev.filter(p => p !== productName);
      } else {
        if (prev.length < 2) return [...prev, productName];
        return prev; // Max 2
      }
    });
  };

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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
      
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

      {/* Single Unified Box for Cards and Graph */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <div 
        className="glass-panel" 
        style={{ display: activeTab === 'Overview' ? 'block' : 'none', padding: '24px' }}
      >
        
        {/* Ecommerce Metrics Row */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>Ecommerce Metrics</p>
          <button 
            onClick={scrollLeftEcomm}
            style={{
              position: 'absolute', left: '-12px', top: '55%', transform: 'translateY(-50%)', zIndex: 10,
              backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', color: 'var(--text-secondary)'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={scrollRightEcomm}
            style={{
              position: 'absolute', right: '-12px', top: '55%', transform: 'translateY(-50%)', zIndex: 10,
              backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', color: 'var(--text-secondary)'
            }}
          >
            <ChevronRight size={18} />
          </button>

          <div ref={scrollContainerEcommRef} className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '8px' }} onScroll={() => setTooltipState(null)}>
            {ecommMetricsInfo.map(metric => {
              const currentVal = calculateTotal(currentData, metric.id);
              const compareVal = calculateTotal(compareData, metric.id);
              const change = calculateChange(currentVal, compareVal);
              const isSelected = selectedMetrics.includes(metric.id);
              const isPositive = change > 0;
              const isNeutral = change === 0;
              const selectedIndex = selectedMetrics.indexOf(metric.id);
              const borderColor = isSelected ? CHART_COLORS[selectedIndex] : 'transparent';

              return (
                <div 
                  key={metric.id}
                  onClick={() => handleMetricToggle(metric.id)}
                  onMouseMove={(e) => {
                    setTooltipState({ x: e.clientX, y: e.clientY, label: metric.label, value: metric.fullFormat(currentVal) });
                  }}
                  onMouseLeave={() => setTooltipState(null)}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    border: isSelected ? `1px solid ${borderColor}` : `1px solid var(--border-color)`,
                    backgroundColor: isSelected ? 'rgba(0, 190, 165, 0.03)' : 'white',
                    borderRadius: '8px',
                    width: '200px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: '16px', left: 0, width: '3px', height: '16px', backgroundColor: borderColor, borderRadius: '0 4px 4px 0' }}></div>
                  <div className="flex-between" style={{ width: '100%', paddingLeft: '8px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{metric.label}</span>
                    <div style={{ 
                      width: '16px', height: '16px', 
                      borderRadius: '4px', 
                      border: `1px solid ${isSelected ? borderColor : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? borderColor : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                    </div>
                  </div>
                  <div style={{ paddingLeft: '8px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{metric.format(currentVal)}</span>
                  </div>
                  {isCompareEnabled && (
                    <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '4px', paddingLeft: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>vs last period</span>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '600', 
                        color: isNeutral ? 'var(--text-secondary)' : isPositive ? 'var(--success-color)' : 'var(--danger-color)',
                        display: 'flex', alignItems: 'center'
                      }}>
                        {isNeutral ? <Minus size={12} style={{ marginRight: '2px' }}/> : isPositive ? <TrendingUp size={12} style={{ marginRight: '2px' }}/> : <TrendingDown size={12} style={{ marginRight: '2px' }}/>}
                        {Math.abs(change).toFixed(2).replace('.00', '')}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ads Metrics Row */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>Ads Metrics</p>
          <button 
            onClick={scrollLeftAds}
            style={{
              position: 'absolute', left: '-12px', top: '55%', transform: 'translateY(-50%)', zIndex: 10,
              backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', color: 'var(--text-secondary)'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={scrollRightAds}
            style={{
              position: 'absolute', right: '-12px', top: '55%', transform: 'translateY(-50%)', zIndex: 10,
              backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', color: 'var(--text-secondary)'
            }}
          >
            <ChevronRight size={18} />
          </button>

          <div ref={scrollContainerAdsRef} className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '8px' }} onScroll={() => setTooltipState(null)}>
            {adsMetricsInfo.map(metric => {
              const currentVal = metric.id === 'roi' ? (currentData.reduce((s,i)=>s+i.roi,0)/(currentData.filter(i=>i.roi).length||1)) : calculateTotal(currentData, metric.id);
              const compareVal = metric.id === 'roi' ? (compareData.reduce((s,i)=>s+i.roi,0)/(compareData.filter(i=>i.roi).length||1)) : calculateTotal(compareData, metric.id);
              const change = calculateChange(currentVal, compareVal);
              const isSelected = selectedMetrics.includes(metric.id);
              const isPositive = change > 0;
              const isNeutral = change === 0;
              const selectedIndex = selectedMetrics.indexOf(metric.id);
              const borderColor = isSelected ? CHART_COLORS[selectedIndex] : 'transparent';

              return (
                <div 
                  key={metric.id}
                  onClick={() => handleMetricToggle(metric.id)}
                  onMouseMove={(e) => {
                    setTooltipState({ x: e.clientX, y: e.clientY, label: metric.label, value: metric.fullFormat(currentVal) });
                  }}
                  onMouseLeave={() => setTooltipState(null)}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    border: isSelected ? `1px solid ${borderColor}` : `1px solid var(--border-color)`,
                    backgroundColor: isSelected ? 'rgba(0, 190, 165, 0.03)' : 'white',
                    borderRadius: '8px',
                    width: '200px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: '16px', left: 0, width: '3px', height: '16px', backgroundColor: borderColor, borderRadius: '0 4px 4px 0' }}></div>
                  <div className="flex-between" style={{ width: '100%', paddingLeft: '8px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{metric.label}</span>
                    <div style={{ 
                      width: '16px', height: '16px', 
                      borderRadius: '4px', 
                      border: `1px solid ${isSelected ? borderColor : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? borderColor : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                    </div>
                  </div>
                  <div style={{ paddingLeft: '8px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{metric.format(currentVal)}</span>
                  </div>
                  {isCompareEnabled && (
                    <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '4px', paddingLeft: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>vs last period</span>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '600', 
                        color: isNeutral ? 'var(--text-secondary)' : isPositive ? 'var(--success-color)' : 'var(--danger-color)',
                        display: 'flex', alignItems: 'center'
                      }}>
                        {isNeutral ? <Minus size={12} style={{ marginRight: '2px' }}/> : isPositive ? <TrendingUp size={12} style={{ marginRight: '2px' }}/> : <TrendingDown size={12} style={{ marginRight: '2px' }}/>}
                        {Math.abs(change).toFixed(2).replace('.00', '')}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph */}
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} dy={10} />
              
              {selectedMetrics.map((metricId, index) => (
                <YAxis 
                  key={`yaxis-${metricId}`}
                  yAxisId={metricId} 
                  orientation={index % 2 === 0 ? "left" : "right"} 
                  hide={index > 1} // Hide axes beyond the first two to keep UI clean
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} 
                  axisLine={false} tickLine={false} 
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `Rp${(val / 1000000).toFixed(0)} jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
                    return val;
                  }}
                />
              ))}
              
              <Tooltip 
                formatter={(value, name) => {
                  const isRp = name.includes('GMV') || name.includes('Revenue') || name.includes('Cost');
                  if (name.includes('ROI')) return [value.toFixed(2), name];
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
                    yAxisId={metricId}
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
                      yAxisId={metricId}
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
          Menampilkan data: <strong>{['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][aggregatedDetail.targetMonthIndex]} {aggregatedDetail.isFullMonth ? '(Full Month)' : `Week ${aggregatedDetail.targetWeekNum}`}</strong> vs <strong>{['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][compareAggregatedDetail.targetMonthIndex]} {compareAggregatedDetail.isFullMonth ? '(Full Month)' : `Week ${compareAggregatedDetail.targetWeekNum}`}</strong>
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
                  labelLine={false}
                  label={renderCustomizedLabel}
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

        <div style={{ marginTop: '48px', borderTop: '1px solid var(--border-color)', paddingTop: '32px', paddingBottom: '32px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '24px' }}>Distribusi GMV per Produk (SKU)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px', alignItems: 'center' }}>
            <div style={{ position: 'relative', height: '250px' }}>
              {overviewSkuPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overviewSkuPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {overviewSkuPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SKU_PIE_COLORS[index % SKU_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatRpFull(value)}
                      contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  Tidak ada data
                </div>
              )}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>SKU</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '12px' }} className="hide-scrollbar">
              {allOverviewSkus.map((entry, index) => {
                const defaultSelected = allOverviewSkus.slice(0, 5).map(s => s.name);
                const isSelected = overviewSelectedSkus.length > 0 
                  ? overviewSelectedSkus.includes(entry.name)
                  : defaultSelected.includes(entry.name);
                  
                const pieIndex = overviewSkuPieData.findIndex(d => d.name === entry.name);
                const color = pieIndex !== -1 ? SKU_PIE_COLORS[pieIndex % SKU_PIE_COLORS.length] : 'var(--border-color)';
                
                const totalVal = allOverviewSkus.reduce((acc, curr) => acc + curr.value, 0);
                const pct = totalVal > 0 ? ((entry.value / totalVal) * 100).toFixed(1) : 0;
                
                return (
                  <div 
                    key={entry.name} 
                    onClick={() => toggleOverviewSku(entry.name)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '8px 12px', borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(0,0,0,0.02)' : 'transparent',
                      borderRadius: '8px',
                      opacity: isSelected ? 1 : 0.5,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}></div>
                      <span style={{ fontWeight: isSelected ? '600' : '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{entry.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <span style={{ fontWeight: '600' }}>{formatRpDetail(entry.value)}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', width: '48px', textAlign: 'right' }}>{pct}%</span>
                      {isCompareEnabled && (
                        <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                          <ChangeIndicator current={entry.value} previous={entry.compareValue} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeMonths.map((monthStr) => {
            const monthSettings = getSettingsForMonth(monthStr);
            const actionPlanNotes = monthSettings.actionPlanNotes || [];
            
            return (
              <ActionPlanNotes 
                key={monthStr}
                monthName={monthStr}
                notes={actionPlanNotes}
                onUpdateNotes={(newNotes) => updateMonthlySettings(monthStr, { actionPlanNotes: newNotes })}
              />
            );
          })}
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

        {/* SKU Comparison Top Area */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Perbandingan Produk</h2>
            {skuSelectedProducts.length === 0 && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>(Otomatis menampilkan 2 produk teratas)</span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
            
            {/* Metric Cards for Selected Products */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {productsToPlot.map((prodName, index) => {
                // Find total metric for this product
                const prodData = skuTableData.find(p => p.name === prodName);
                const totalVal = prodData ? prodData.current : 0;
                const compareVal = prodData ? prodData.compare : 0;
                const metricInfo = metricsInfo.find(m => m.id === skuSelectedMetric);
                const formatFn = metricInfo ? metricInfo.fullFormat : formatNumberFull;
                const color = index === 0 ? CHART_COLORS[0] : CHART_COLORS[1];

                return (
                  <div key={prodName} style={{ 
                    padding: '16px', 
                    border: `1px solid ${color}`, 
                    borderRadius: '8px',
                    backgroundColor: `${color}10`, // 10% opacity for background
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, marginRight: '8px' }}></span>
                      {prodName}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {formatFn(totalVal)}
                    </div>
                    {isCompareEnabled && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>vs last period:</span>
                        <ChangeIndicator current={totalVal} previous={compareVal} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Line Chart */}
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={skuChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} tickFormatter={(val) => {
                    const metricInfo = metricsInfo.find(m => m.id === skuSelectedMetric);
                    return metricInfo ? metricInfo.format(val) : formatNumber(val);
                  }}/>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value) => {
                      const metricInfo = metricsInfo.find(m => m.id === skuSelectedMetric);
                      return metricInfo ? metricInfo.fullFormat(value) : formatNumberFull(value);
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                  {productsToPlot.map((prodName, index) => (
                    <React.Fragment key={prodName}>
                      <Line 
                        type="monotone" 
                        dataKey={prodName} 
                        name={prodName}
                        stroke={index === 0 ? CHART_COLORS[0] : CHART_COLORS[1]} 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 6, fill: index === 0 ? CHART_COLORS[0] : CHART_COLORS[1], stroke: '#fff', strokeWidth: 2 }}
                      />
                      {isCompareEnabled && (
                        <Line 
                          type="monotone" 
                          dataKey={`${prodName}Compare`} 
                          name={`${prodName} (Bandingkan)`}
                          stroke={index === 0 ? CHART_COLORS[0] : CHART_COLORS[1]} 
                          strokeWidth={2} 
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

        {/* SKU Table */}
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                <th style={{ padding: '16px', width: '40px' }}></th>
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
              {paginatedSkuData.map((row, index) => {
                const metricInfo = metricsInfo.find(m => m.id === skuSelectedMetric);
                const formatFn = metricInfo ? metricInfo.fullFormat : formatNumberFull;
                const isSelected = skuSelectedProducts.includes(row.name);
                const isDisabled = !isSelected && skuSelectedProducts.length >= 2;
                
                return (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isSelected ? 'rgba(0, 181, 165, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '16px' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleSkuProductSelect(row.name)}
                        style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', transform: 'scale(1.5)', accentColor: 'var(--primary-color)' }}
                      />
                    </td>
                    <td style={{ padding: '16px' }}>{(skuCurrentPage - 1) * 10 + index + 1}</td>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{row.name}</td>
                    <td style={{ padding: '16px' }}>{formatFn(row.current)}</td>
                    <td style={{ padding: '16px' }}>{formatFn(row.compare)}</td>
                    <td style={{ padding: '16px' }}>
                      <ChangeIndicator current={row.compare} previous={row.current} />
                    </td>
                  </tr>
                );
              })}
              {paginatedSkuData.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada data tersedia</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalSkuPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setSkuCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={skuCurrentPage === 1}
                style={{ 
                  padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                  backgroundColor: skuCurrentPage === 1 ? 'var(--bg-color)' : 'white',
                  cursor: skuCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  color: skuCurrentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Page <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{skuCurrentPage}</span> of {totalSkuPages}
              </span>
              <button 
                onClick={() => setSkuCurrentPage(prev => Math.min(totalSkuPages, prev + 1))}
                disabled={skuCurrentPage === totalSkuPages}
                style={{ 
                  padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                  backgroundColor: skuCurrentPage === totalSkuPages ? 'var(--bg-color)' : 'white',
                  cursor: skuCurrentPage === totalSkuPages ? 'not-allowed' : 'pointer',
                  color: skuCurrentPage === totalSkuPages ? 'var(--text-secondary)' : 'var(--text-primary)'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
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
