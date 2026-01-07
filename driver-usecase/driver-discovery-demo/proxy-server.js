// Simple proxy server to bypass CORS restrictions
// Forwards requests from browser to CDS

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3100;
const CDS_BASE_URL = 'https://34.93.141.21.sslip.io';

// Enable CORS for all origins (dev only)
app.use(cors());
app.use(express.json());

// Proxy endpoint for /beckn/discover
app.all('/beckn/discover', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(400).json({ error: 'x-api-key header is required' });
    }

    console.log(`[PROXY] ${req.method} /beckn/discover`);
    console.log('[PROXY] Request body:', JSON.stringify(req.body, null, 2));

    const response = await fetch(`${CDS_BASE_URL}/beckn/discover`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    console.log(`[PROXY] CDS Response Status: ${response.status}`);

    res.status(response.status).json(data);
  } catch (error) {
    console.error('[PROXY] Error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
});

// Proxy endpoint for /beckn/v2/catalog/publish
app.post('/beckn/v2/catalog/publish', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(400).json({ error: 'x-api-key header is required' });
    }

    console.log('[PROXY] POST /beckn/v2/catalog/publish');
    console.log('[PROXY] Request body structure:', JSON.stringify(req.body, null, 2));
    console.log('[PROXY] Has context?', !!req.body.context);
    console.log('[PROXY] Has message?', !!req.body.message);
    console.log('[PROXY] Catalogs count:', req.body.message?.catalogs?.length || 0);

    const response = await fetch(`${CDS_BASE_URL}/beckn/v2/catalog/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    console.log(`[PROXY] CDS Response Status: ${response.status}`);
    console.log('[PROXY] CDS Response:', JSON.stringify(data, null, 2));

    res.status(response.status).json(data);
  } catch (error) {
    console.error('[PROXY] Error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  CDS Proxy Server Running                                ║
║  http://localhost:${PORT}                                    ║
║                                                          ║
║  This proxy forwards requests to:                       ║
║  ${CDS_BASE_URL}  ║
║                                                          ║
║  Endpoints:                                              ║
║  • GET/POST /beckn/discover                              ║
║  • POST /beckn/v2/catalog/publish                        ║
╚══════════════════════════════════════════════════════════╝
  `);
});
