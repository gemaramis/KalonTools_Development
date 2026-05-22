export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { targetUrl } = req.query;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing targetUrl parameter' });
  }

  try {
    let fetchUrl = targetUrl;
    
    if (targetUrl.includes('/edit')) {
      const sheetId = targetUrl.match(/\/d\/(.+?)\//)?.[1];
      const gidMatch = targetUrl.match(/[?#&]gid=([0-9]+)/);
      
      if (sheetId) {
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        if (gidMatch) {
          fetchUrl += `&gid=${gidMatch[1]}`;
        }
      }
    }

    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Sheets: ${response.statusText}`);
    }

    const csvText = await response.text();
    
    if (csvText.trim().toLowerCase().startsWith('<!doctype') || csvText.trim().toLowerCase().startsWith('<html')) {
      throw new Error('Spreadsheet access is restricted. Please check sharing settings.');
    }

    // Set headers to allow caching or CORS if needed
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=59');
    
    return res.status(200).send(csvText);

  } catch (error) {
    console.error('Error in read-sheet:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
