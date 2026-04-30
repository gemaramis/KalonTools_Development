import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1ZeGXZt0pAueJsPq_iqM_-PGE-LcPZ3c2AphDeIlWObA/export?format=csv';

const parseRp = (value) => {
  if (!value) return 0;
  const numString = value.toString().replace(/[^0-9]/g, '');
  return parseInt(numString, 10) || 0;
};

export const useGoogleSheetData = (inputUrl) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!inputUrl) {
      setLoading(false);
      return;
    }

    const fetchData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        let fetchUrl = inputUrl;
        
        // Auto-convert standard edit link to CSV export link if detected
        if (inputUrl.includes('/edit')) {
          const sheetId = inputUrl.match(/\/d\/(.+?)\//)?.[1];
          const gidMatch = inputUrl.match(/[#&]gid=([0-9]+)/);
          const gid = gidMatch ? gidMatch[1] : '0';
          if (sheetId) {
            fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
          }
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('Failed to fetch data');
        const csvText = await response.text();
        
        // Detect if response is HTML (login page) instead of CSV
        if (csvText.trim().toLowerCase().startsWith('<!doctype') || csvText.trim().toLowerCase().startsWith('<html')) {
          throw new Error('Spreadsheet access is restricted. Please change sharing settings to "Anyone with the link can view".');
        }
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data
              .filter(row => Object.values(row).some(val => val && val.trim() !== '')) // Filter out completely empty rows
              .map((row, index) => {
                const finalPrice = parseRp(row['Final Price nego'] || row['Final Price Nego'] || row['finalPrice'] || '');
                const rateCard = parseRp(row['Rate Card'] || row['rateCard'] || '');
                
                // Base tier logic for simulation
                const tier = (row['Tier'] || row['tier'] || '').trim().toUpperCase();
                
                // Simulate GMV and Views since they are not in the master sheet
                let simViews = 0;
                let simGMV = 0;
                
                // Let's create a realistic but simulated GMV/Views based on the price
                if (finalPrice > 0) {
                    simGMV = finalPrice * (1.5 + Math.random() * 1.5); // 1.5x to 3x ROI
                    // Assuming roughly Rp 100 per view on average
                    simViews = finalPrice / 100;
                } else if (tier === 'MEGA') {
                    simViews = 1000000;
                } else if (tier === 'MACRO') {
                    simViews = 250000;
                } else {
                    simViews = 50000;
                }

                return {
                  id: row['KOL ID (wajib isi)'] || row['id'] || index.toString(),
                  username: row['KOL Username (harus akurat)'] || row['username'] || 'Unknown',
                  postingPeriod: row['Posting Period'] || row['postingPeriod'] || 'Unknown',
                  pic: row['PIC'] || row['pic'] || '-',
                  tier: tier ? tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase() : '-',
                  rateCard: rateCard,
                  finalPrice: finalPrice,
                  approval: row['Approval (Koko/Cici)'] || row['approval'] || 'Pending',
                  sow: row['SOW'] || row['sow'] || '-',
                  additionalNotes: row['Additional Notes (Koko/Cici)'] || row['additionalNotes'] || '',
                  dealingStatus: row['Dealing Status (Amel/Ken)'] || row['dealingStatus'] || 'Pending',
                  followUpNotes: row['Follow Up Notes (Amel/Ken)'] || row['followUpNotes'] || '',
                  gmv: Math.round(simGMV),
                  views: Math.round(simViews)
                };
              });
            setData(parsedData);
            if (!isBackground) setLoading(false);
          },
          error: (err) => {
            if (!isBackground) {
              setError(err.message);
              setLoading(false);
            }
          }
        });
      } catch (err) {
        if (!isBackground) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchData(); // Initial fetch
    
    // Set up polling interval every 30 seconds for "live" updates
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [inputUrl]);

  return { data, loading, error };
};
