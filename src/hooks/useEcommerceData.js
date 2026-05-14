import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { parse, isValid } from 'date-fns';

const parseRp = (value) => {
  if (!value) return 0;
  const numString = value.toString().replace(/[^0-9,-]/g, '').split(',')[0];
  return parseInt(numString, 10) || 0;
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  // Try DD/MM/YY format first based on sample data
  const parsed = parse(dateStr, 'dd/MM/yy', new Date());
  if (isValid(parsed)) return parsed;
  
  // Fallback to JS Date parsing
  const fallback = new Date(dateStr);
  return isValid(fallback) ? fallback : null;
};

export const useEcommerceData = (mainUrl, detailUrl) => {
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
        // --- Fetch Main Data ---
        let mainFetchUrl = mainUrl;
        if (mainUrl.includes('/edit')) {
          const sheetId = mainUrl.match(/\/d\/(.+?)\//)?.[1];
          const gidMatch = mainUrl.match(/[#&]gid=([0-9]+)/);
          const gid = gidMatch ? gidMatch[1] : '0';
          if (sheetId) mainFetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        }

        const mainRes = await fetch(mainFetchUrl);
        if (!mainRes.ok) throw new Error('Failed to fetch Main Ecommerce Data');
        const mainCsv = await mainRes.text();

        if (mainCsv.trim().toLowerCase().startsWith('<!doctype') || mainCsv.trim().toLowerCase().startsWith('<html')) {
          throw new Error('Spreadsheet access is restricted. Please change sharing settings to "Anyone with the link can view".');
        }

        Papa.parse(mainCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
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
              }))
              .filter(item => item.dateObj !== null); // Only keep rows with valid dates
            setMainData(parsed);
          }
        });

        // --- Fetch Detail GMV Data ---
        let detailFetchUrl = detailUrl;
        if (detailUrl.includes('/edit')) {
          const sheetId = detailUrl.match(/\/d\/(.+?)\//)?.[1];
          const gidMatch = detailUrl.match(/[#&]gid=([0-9]+)/);
          const gid = gidMatch ? gidMatch[1] : '0';
          if (sheetId) detailFetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        }

        const detailRes = await fetch(detailFetchUrl);
        if (!detailRes.ok) throw new Error('Failed to fetch Detail GMV Data');
        const detailCsv = await detailRes.text();

        Papa.parse(detailCsv, {
          header: false, // Use array indexing to avoid duplicate header conflicts
          skipEmptyLines: true,
          complete: (results) => {
            // Data starts at row 5 (index 4)
            const rows = results.data.slice(4);
            
            const liveData = [];
            const videoData = [];
            const productCardData = [];

            rows.forEach(row => {
              // Ensure row has enough columns
              if (row.length >= 5 && row[1]) {
                liveData.push({
                  month: row[1]?.trim(),
                  week: parseInt(row[2], 10) || 0,
                  affiliate: parseRp(row[3]),
                  seller: parseRp(row[4])
                });
              }
              if (row.length >= 10 && row[6]) {
                videoData.push({
                  month: row[6]?.trim(),
                  week: parseInt(row[7], 10) || 0,
                  affiliate: parseRp(row[8]),
                  seller: parseRp(row[9])
                });
              }
              if (row.length >= 15 && row[11]) {
                productCardData.push({
                  month: row[11]?.trim(),
                  week: parseInt(row[12], 10) || 0,
                  affiliate: parseRp(row[13]),
                  seller: parseRp(row[14])
                });
              }
            });

            setDetailData({
              live: liveData.filter(d => d.month),
              video: videoData.filter(d => d.month),
              productCard: productCardData.filter(d => d.month)
            });
          }
        });

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [mainUrl, detailUrl]);

  return { mainData, detailData, loading, error };
};
