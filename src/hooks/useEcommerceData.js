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

export const useEcommerceData = (mainUrl, detailUrl, adsUrl) => {
  const [mainData, setMainData] = useState([]);
  const [detailData, setDetailData] = useState({
    live: [],
    video: [],
    productCard: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mainUrl || !detailUrl) {
      setLoading(false);
      return;
    }

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
              product: row['Produk'] || '',
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
        if (adsUrl) {
          const adsFetchUrl = `/api/read-sheet?targetUrl=${encodeURIComponent(adsUrl)}`;
          const adsRes = await fetch(adsFetchUrl);
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
                  product: row['Produk'] || '', // Assume it might have a product breakdown
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
                const originalRow = results.data.find(r => r['Date'] === item.dateStr && (r['Produk'] || '') === item.product);
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

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [mainUrl, detailUrl, adsUrl]);

  return { mainData, detailData, loading, error };
};
