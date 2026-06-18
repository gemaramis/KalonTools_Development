import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { parse, isValid } from 'date-fns';

const parseRp = (value) => {
  if (!value) return 0;
  const numString = value.toString().replace(/[^0-9,-]/g, '').split(',')[0];
  return parseInt(numString, 10) || 0;
};

const INDONESIAN_MONTHS = {
  'jan': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr', 'mei': 'May', 'jun': 'Jun',
  'jul': 'Jul', 'ags': 'Aug', 'sep': 'Sep', 'okt': 'Oct', 'nov': 'Nov', 'des': 'Dec'
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  // Try DD/MM/YY format first based on sample data
  let parsed = parse(dateStr, 'dd/MM/yy', new Date());
  if (isValid(parsed)) return parsed;

  parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
  if (isValid(parsed)) return parsed;
  
  // Handle Indonesian months like "1 Okt 2025" or "1  Okt 2025"
  let normalizedStr = dateStr.toLowerCase().replace(/\s+/g, ' ').trim();
  Object.keys(INDONESIAN_MONTHS).forEach(idMonth => {
    normalizedStr = normalizedStr.replace(new RegExp(`\\b${idMonth}\\b`, 'g'), INDONESIAN_MONTHS[idMonth]);
  });

  // Fallback to JS Date parsing
  const fallback = new Date(normalizedStr);
  return isValid(fallback) ? fallback : null;
};

export const useEcommerceData = (ecommUrl, adsUrl, financeUrl, contentDistUrl) => {
  const [mainData, setMainData] = useState([]);
  const [detailData, setDetailData] = useState({
    live: [],
    video: [],
    productCard: []
  });
  const [financeData, setFinanceData] = useState([]);
  const [targetPlanningData, setTargetPlanningData] = useState([]);
  const [contentDistData, setContentDistData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ecommUrl) {
      setLoading(false);
      return;
    }

    // Use the hardcoded GID for Main Data since it's hidden from settings,
    // but use the exact user-provided URL for Detail GMV so they can change the tab anytime.
    const mainUrl = ecommUrl.replace(/gid=[0-9]+/g, 'gid=1019025468');
    const detailUrl = ecommUrl;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let combinedMainData = [];

        // --- Helper for Papa Parse ---
        const parseCSV = (csvStr, options) => new Promise((resolve, reject) => {
          Papa.parse(csvStr, {
            ...options,
            complete: resolve,
            error: reject
          });
        });

        // --- Fetch Main Ecommerce Data ---
        if (mainUrl) {
          const mainFetchUrl = `/api/read-sheet?targetUrl=${encodeURIComponent(mainUrl)}`;
          const mainRes = await fetch(mainFetchUrl);
          if (!mainRes.ok) throw new Error('Failed to fetch Main Ecommerce Data');
          const mainCsv = await mainRes.text();

          if (mainCsv.trim().toLowerCase().startsWith('<!doctype') || mainCsv.trim().toLowerCase().startsWith('<html')) {
            throw new Error('Spreadsheet access is restricted. Please check serverless function configuration.');
          }

          const results = await parseCSV(mainCsv, { header: true, skipEmptyLines: true });
          const parsed = results.data
            .filter(row => row['Tanggal'] && row['Tanggal'].trim() !== '')
            .map(row => ({
              dateStr: row['Tanggal'],
              dateObj: parseDate(row['Tanggal']),
              month: row['Bulan'] || '',
              product: (row['Produk'] || '').trim(),
              gmv: parseRp(row['GMV']),
              productsSold: parseRp(row['Produk Terjual']),
              impressionsShopTab: parseRp(row['Impresi Shop Tab']),
              impressionsLive: parseRp(row['Impresi Live']),
              impressionsVideo: parseRp(row['Impresi Video']),
              impressionsProductCard: parseRp(row['Impresi Kartu Produk']),
              impressionsTotal: parseRp(row['Total Impresi']),
              
              // Initialize Ads fields to 0 for Ecomm rows
              skuOrders: 0,
              grossRevenue: 0,
              cost: 0,
              roi: 0
            }))
            .filter(item => item.dateObj !== null);
          combinedMainData = [...combinedMainData, ...parsed];
        }

        // --- Fetch Ads Data ---
        let adsValues = [];
        let kolValues = [];
        let adsGmvValues = [];
        const DEFAULT_ADS_LINK = 'https://docs.google.com/spreadsheets/d/1CjEAcExQFuQtCrqqXOezRe8icXeVcePIEr0fALNQIMI/edit?gid=372012532#gid=372012532';
        const actualAdsUrl = adsUrl && adsUrl.trim() !== '' ? adsUrl : DEFAULT_ADS_LINK;

        const attemptParseAds = async (targetUrl) => {
          let aVals = [], kVals = [], gVals = [];
          try {
            const fetchUrl = `/api/read-sheet?targetUrl=${encodeURIComponent(targetUrl)}`;
            const res = await fetch(fetchUrl);
            if (!res.ok) return { aVals, kVals, gVals, ok: false };
            
            const csvText = await res.text();
            if (csvText.trim().toLowerCase().startsWith('<!doctype') || csvText.trim().toLowerCase().startsWith('<html')) {
              return { aVals, kVals, gVals, ok: false };
            }
            
            const results = await parseCSV(csvText, { header: false, skipEmptyLines: true });
            const adsRows = results.data;
            
            const totalIndices = [];
            const totalRow = adsRows.find(r => r.some(c => typeof c === 'string' && c.trim().toUpperCase() === 'TOTAL'));
            if (totalRow) {
              totalRow.forEach((c, i) => { if (typeof c === 'string' && c.trim().toUpperCase() === 'TOTAL') totalIndices.push(i); });
            }
            
            let valueIndices = [];
            const monthRow = adsRows.find(r => r.some(c => typeof c === 'string' && c.trim().toLowerCase() === 'month'));
            if (monthRow) {
              monthRow.forEach((c, i) => {
                if (i > 0 && typeof c === 'string' && c.trim() !== '') valueIndices.push(i);
              });
            }
            
            const reversedAdsRows = [...adsRows].reverse();
            
            const extractVals = (row) => {
              const vals = [];
              row.forEach(c => {
                if (typeof c === 'string') {
                  const clean = c.trim();
                  if (clean.toUpperCase().startsWith('RP')) {
                    vals.push(parseInt(clean.replace(/[^0-9,-]/g, '')) || 0);
                  } else if (/^[0-9.,]+$/.test(clean) && !clean.includes('%')) {
                    const num = parseInt(clean.replace(/[^0-9,-]/g, ''));
                    if (!isNaN(num)) vals.push(num);
                  }
                } else if (typeof c === 'number') {
                  vals.push(c);
                }
              });
              return vals;
            };

            const spendingRow = reversedAdsRows.find(r => r.some(c => typeof c === 'string' && ['ad cost', 'spending', 'ads cost'].includes(c.trim().toLowerCase())));
            if (spendingRow) {
              aVals = extractVals(spendingRow);
            }
            
            const kolRow = reversedAdsRows.find(r => r.some(c => typeof c === 'string' && c.trim().toLowerCase().includes('kol')));
            if (kolRow) {
              kVals = extractVals(kolRow);
            }
            
            const gmvRow = reversedAdsRows.find(r => r.some(c => typeof c === 'string' && ['GMV', 'ACTUAL', 'EARNING'].includes(c.trim().toUpperCase())));
            if (gmvRow) {
              gVals = extractVals(gmvRow);
            }
            
            return { aVals, kVals, gVals, ok: true };
          } catch (e) {
            console.error(e);
            return { aVals, kVals, gVals, ok: false };
          }
        };

        if (actualAdsUrl) {
          let parsedAds = await attemptParseAds(actualAdsUrl);
          
          // If the URL succeeded but yielded absolutely no values, it might be the wrong spreadsheet tab.
          if ((!parsedAds.ok || (parsedAds.aVals.length === 0 && parsedAds.kVals.length === 0)) && actualAdsUrl !== DEFAULT_ADS_LINK) {
            parsedAds = await attemptParseAds(DEFAULT_ADS_LINK);
          }
          
          adsValues = parsedAds.aVals;
          kolValues = parsedAds.kVals;
          adsGmvValues = parsedAds.gVals;

          // Now fetch details for table display
          const adsRes = await fetch(`/api/read-sheet?targetUrl=${encodeURIComponent(actualAdsUrl)}`);
          if (adsRes.ok) {
            const adsCsv = await adsRes.text();
            if (!adsCsv.trim().toLowerCase().startsWith('<!doctype') && !adsCsv.trim().toLowerCase().startsWith('<html')) {
              const results = await parseCSV(adsCsv, { header: true, skipEmptyLines: true });
              const adsParsed = results.data
                .filter(row => row['Date'] && row['Date'].trim() !== '')
                .map(row => ({
                  dateStr: row['Date'],
                  dateObj: parseDate(row['Date']),
                  month: row['Bulan'] || '',
                  product: (row['Produk'] || '').trim(), // Assume it might have a product breakdown
                  gmv: 0, productsSold: 0, impressionsShopTab: 0, impressionsLive: 0, impressionsVideo: 0, impressionsProductCard: 0, impressionsTotal: 0, // Ecomm fields

                  // Ads fields
                  skuOrders: parseRp(row['Order'] || row['SKU Orders']),
                  grossRevenue: parseRp(row['Gross Revenue']),
                  cost: parseRp(row['Cost '] || row['Cost']),
                  roi: 0 // Parsed below
                }))
                .filter(item => item.dateObj !== null);
              
              // Let's quickly fix ROI parsing to handle floats since it's a percentage or ratio
              adsParsed.forEach(item => {
                const originalRow = results.data.find(r => r['Date'] === item.dateStr && (r['Produk'] || '').trim() === item.product);
                if (originalRow && originalRow['ROI']) {
                  const cleaned = originalRow['ROI'].toString().replace(/[^0-9.,-]/g, '').replace(/,/, '.');
                  item.roi = parseFloat(cleaned) || 0;
                }
              });

              combinedMainData = [...combinedMainData, ...adsParsed];
            }
          }
        }

        setMainData(combinedMainData);

        // --- Fetch Target Planning Data ---
        let targetPlanningData = [];
        try {
          const tpUrl = `/api/read-sheet?targetUrl=${encodeURIComponent('https://docs.google.com/spreadsheets/d/1CjEAcExQFuQtCrqqXOezRe8icXeVcePIEr0fALNQIMI/edit?gid=1151289301#gid=1151289301')}`;
          const tpRes = await fetch(tpUrl);
          if (tpRes.ok) {
            const tpCsv = await tpRes.text();
            if (!tpCsv.trim().toLowerCase().startsWith('<!doctype') && !tpCsv.trim().toLowerCase().startsWith('<html')) {
              const tpResults = await parseCSV(tpCsv, { header: false, skipEmptyLines: true });
              const tpRows = tpResults.data;
              
              const monthRowIndex = tpRows.findIndex(r => r.some(c => typeof c === 'string' && c.toLowerCase().includes('januari')));
              if (monthRowIndex !== -1) {
                const monthRow = tpRows[monthRowIndex];
                const monthTotals = [];
                monthRow.forEach((c, idx) => {
                  if (typeof c === 'string' && c.trim() !== '') {
                    monthTotals.push({ month: c.trim().replace(/ 202[0-9]/, ''), colIdx: idx + 1 });
                  }
                });

                const findRow = (keyword) => tpRows.find(r => r[0] && typeof r[0] === 'string' && r[0].trim().toLowerCase() === keyword.toLowerCase());
                
                const targetGmvMaxRow = findRow('target gmv max');
                const spendingRow = findRow('spending');
                const targetGmvRow = findRow('target gmv');
                const gmvRow = findRow('gmv');
                const ttamRow = findRow('cost ttam');
                const kolRow = tpRows.find(r => r[0] && typeof r[0] === 'string' && r[0].trim().toLowerCase().includes('kol cost'));

                const parseRpValue = (val) => {
                  if (!val || typeof val !== 'string') return 0;
                  const cleaned = val.replace(/[^0-9,-]/g, '');
                  return parseInt(cleaned) || 0;
                };

                targetPlanningData = monthTotals.map((m, idx) => {
                  const data = {
                    month: m.month,
                    targetAdsCost: targetGmvMaxRow ? parseRpValue(targetGmvMaxRow[m.colIdx]) : 0,
                    spending: spendingRow ? parseRpValue(spendingRow[m.colIdx]) : 0,
                    targetGmv: targetGmvRow ? parseRpValue(targetGmvRow[m.colIdx]) : 0,
                    gmv: gmvRow ? parseRpValue(gmvRow[m.colIdx]) : 0,
                    // ttamCost is in the lower section where 'Total' is at the end (idx + 5 instead of idx + 1)
                    ttamCost: ttamRow ? parseRpValue(ttamRow[m.colIdx + 4]) : 0,
                    kolCost: 0
                  };
                  return data;
                });
                
                if (kolRow) {
                  let monthIdx = 0;
                  for (let i = 1; i < kolRow.length; i += 3) {
                    if (targetPlanningData[monthIdx]) {
                      targetPlanningData[monthIdx].kolCost = parseRpValue(kolRow[i]);
                    }
                    monthIdx++;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch target planning data", e);
        }
        setTargetPlanningData(targetPlanningData);

        // --- Fetch Detail GMV Data ---
        if (detailUrl) {
          const detailFetchUrl = `/api/read-sheet?targetUrl=${encodeURIComponent(detailUrl)}`;
          const detailRes = await fetch(detailFetchUrl);
          if (!detailRes.ok) throw new Error('Failed to fetch Detail GMV Data');
          const detailCsv = await detailRes.text();

          const results = await parseCSV(detailCsv, { header: false, skipEmptyLines: true });
          const rows = results.data.slice(4);
          
          const liveData = [];
          const videoData = [];
          const productCardData = [];

          rows.forEach(row => {
            if (row.length >= 5 && row[1]) {
              liveData.push({ month: row[1]?.trim(), week: parseInt(row[2], 10) || 0, affiliate: parseRp(row[3]), seller: parseRp(row[4]) });
            }
            if (row.length >= 10 && row[6]) {
              videoData.push({ month: row[6]?.trim(), week: parseInt(row[7], 10) || 0, affiliate: parseRp(row[8]), seller: parseRp(row[9]) });
            }
            if (row.length >= 15 && row[11]) {
              productCardData.push({ month: row[11]?.trim(), week: parseInt(row[12], 10) || 0, affiliate: parseRp(row[13]), seller: parseRp(row[14]) });
            }
          });

          setDetailData({
            live: liveData.filter(d => d.month),
            video: videoData.filter(d => d.month),
            productCard: productCardData.filter(d => d.month)
          });
        }

        // --- Fetch Finance Data ---
        if (financeUrl) {
          const financeFetchUrl = `/api/read-sheet?targetUrl=${encodeURIComponent(financeUrl)}`;
          const financeRes = await fetch(financeFetchUrl);
          if (financeRes.ok) {
            const financeCsv = await financeRes.text();
            if (!financeCsv.trim().toLowerCase().startsWith('<!doctype') && !financeCsv.trim().toLowerCase().startsWith('<html')) {
              const results = await parseCSV(financeCsv, { header: false, skipEmptyLines: true });
              const rows = results.data;
              if (rows.length > 0) {
                const monthIndices = [];
                rows[0].forEach((cell, index) => {
                   if (cell && cell.trim() !== '' && cell !== 'Time period:') {
                      monthIndices.push({ index, month: cell.trim() });
                   }
                });

                const parsedFinance = monthIndices.map(m => ({
                  month: m.month,
                  settlement: 0, revenue: 0, platformCommission: 0, dynamicCommission: 0,
                  adminMall: 0, adminOrder: 0, affiliateCommission: 0,
                  campaignPackage: 0, campaignAdditional: 0,
                  adsBudget: 0, kolBudget: 0,
                  adsGmv: 0, shippingCost: 0
                }));



                rows.forEach(row => {
                  const label = [row[0]||'', row[1]||'', row[2]||'', row[3]||''].join(' ').toLowerCase();
                  let key = null;
                  if (label.includes('total settlement amount')) key = 'settlement';
                  else if (label.includes('total revenue')) key = 'revenue';
                  else if (label.includes('platform commission fee')) key = 'platformCommission';
                  else if (label.includes('dynamic commission')) key = 'dynamicCommission';
                  else if (label.includes('mall service fee')) key = 'adminMall';
                  else if (label.includes('order processing fee')) key = 'adminOrder';
                  else if (label.includes('affiliate commission') && !label.includes('partner') && !label.includes('shop ads')) key = 'affiliateCommission';
                  else if (label.includes('additional campaign package')) key = 'campaignAdditional';
                  else if (label.includes('campaign package')) key = 'campaignPackage';
                  else if (label === 'shipping cost' || (row[0] === 'Shipping cost' && row[1]?.includes('net shipping cost'))) key = 'shippingCost';
                  
                  if (key) {
                    parsedFinance.forEach((item, idx) => {
                      const val = row[monthIndices[idx].index];
                      if (val) {
                        item[key] = parseInt(val.toString().replace(/[^0-9,-]/g, '')) || 0;
                      }
                    });
                  }
                });
                setFinanceData(parsedFinance.map((item, idx) => ({
                  ...item,
                  adsBudget: adsValues[idx] || 0,
                  kolBudget: kolValues[idx] || 0,
                  adsGmv: adsGmvValues[idx] || 0
                })));
              }
            }
          }
        }

        // --- Fetch Content Distribution Data ---
        if (contentDistUrl) {
          try {
            const distRes = await fetch(`/api/read-sheet?targetUrl=${encodeURIComponent(contentDistUrl)}`);
            if (distRes.ok) {
              const distCsv = await distRes.text();
              if (!distCsv.trim().toLowerCase().startsWith('<!doctype') && !distCsv.trim().toLowerCase().startsWith('<html')) {
                const results = await parseCSV(distCsv, { header: false, skipEmptyLines: true });
                const rows = results.data;
                const parsedDistData = [];
                let currentMonth = 'Mei 2026';
                
                for (let i = 0; i < rows.length; i++) {
                  const row = rows[i];
                  if (!row || !row[0]) continue;
                  
                  if (!row[0].toLowerCase().includes('week') && (!row[1] || row[1].trim() === '')) {
                     currentMonth = row[0].trim();
                     continue;
                  }
                  
                  if (row[0].toLowerCase().includes('week 1')) {
                    const productName = row[0].replace(/week 1/i, '').trim();
                    const weeksData = [];
                    
                    for (let w = 0; w < 4; w++) {
                      const colStart = w * 4;
                      const weekInfo = {
                        week: `Week ${w+1}`,
                        totalVideo: 0,
                        ready: 0,
                        notActive: 0,
                        inQueue: 0,
                        learning: 0,
                        rejected: 0,
                        delivering: 0
                      };
                      
                      for (let j = i + 1; j < Math.min(i + 15, rows.length); j++) {
                        const subRow = rows[j];
                        if (!subRow || !subRow[0] || subRow[0].trim() === '') break;
                        
                        const label = subRow[colStart]?.toLowerCase().trim();
                        const valStr = subRow[colStart + 1]?.toString().replace(/[^0-9]/g, '');
                        const val = parseInt(valStr, 10) || 0;
                        
                        if (label === 'total video') weekInfo.totalVideo = val;
                        else if (label === 'ready') weekInfo.ready = val;
                        else if (label === 'not active') weekInfo.notActive = val;
                        else if (label === 'in queue') weekInfo.inQueue = val;
                        else if (label === 'learning') weekInfo.learning = val;
                        else if (label === 'rejected') weekInfo.rejected = val;
                        else if (label === 'delivering') weekInfo.delivering = val;
                      }
                      
                      weeksData.push(weekInfo);
                    }
                    
                    parsedDistData.push({
                      month: currentMonth,
                      product: productName,
                      weeks: weeksData
                    });
                  }
                }
                setContentDistData(parsedDistData);
              }
            }
          } catch (e) {
            console.error("Error parsing content distribution data:", e);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [ecommUrl, adsUrl, financeUrl, contentDistUrl]);

  return { mainData, detailData, financeData, targetPlanningData, contentDistData, loading, error };
};
