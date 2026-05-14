export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { appsScriptUrl, payload } = req.body;

  if (!appsScriptUrl) {
    return res.status(400).json({ error: 'Apps Script URL is missing in request' });
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    // Apps Script redirects or returns weird responses sometimes. 
    // We just return success if it doesn't throw.
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error in write-sheet:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
