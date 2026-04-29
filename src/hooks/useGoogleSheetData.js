import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1ZeGXZt0pAueJsPq_iqM_-PGE-LcPZ3c2AphDeIlWObA/export?format=csv';

const parseRp = (value) => {
  if (!value) return 0;
  const numString = value.toString().replace(/[^0-9]/g, '');
  return parseInt(numString, 10) || 0;
};

export const useGoogleSheetData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error('Failed to fetch data');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data
              .filter(row => row['KOL ID (wajib isi)']) // Ensure it's a valid row
              .map((row, index) => {
                const finalPrice = parseRp(row['Final Price nego'] || row['Final Price Nego'] || '');
                const rateCard = parseRp(row['Rate Card'] || '');
                
                // Base tier logic for simulation
                const tier = (row['Tier'] || '').trim().toUpperCase();
                
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
                  id: row['KOL ID (wajib isi)'] || index.toString(),
                  username: row['KOL Username (harus akurat)'],
                  postingPeriod: row['Posting Period'],
                  pic: row['PIC'],
                  tier: row['Tier'] ? row['Tier'].charAt(0).toUpperCase() + row['Tier'].slice(1).toLowerCase() : '',
                  rateCard: rateCard,
                  finalPrice: finalPrice,
                  approval: row['Approval (Koko/Cici)'],
                  sow: row['SOW'],
                  additionalNotes: row['Additional Notes (Koko/Cici)'],
                  dealingStatus: row['Dealing Status (Amel/Ken)'],
                  followUpNotes: row['Follow Up Notes (Amel/Ken)'],
                  gmv: Math.round(simGMV),
                  views: Math.round(simViews)
                };
              });
            setData(parsedData);
            setLoading(false);
          },
          error: (err) => {
            setError(err.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
