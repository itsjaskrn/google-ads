const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DEVELOPER_TOKEN = process.env.DEVELOPER_TOKEN || 'IEnKgnvxZWs6VCdF8h8NPw';
const GOOGLE_ADS_API = 'https://googleads.googleapis.com';

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Google Ads API Proxy' });
});

app.get('/oauth/authorize', (req, res) => {
  const params = new URLSearchParams({
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri,
    response_type: req.query.response_type,
    scope: req.query.scope,
    state: req.query.state,
    access_type: 'offline',
    prompt: 'consent'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.post('/oauth/token', async (req, res) => {
  try {
    const params = new URLSearchParams(req.body);
    const response = await axios.post('https://oauth2.googleapis.com/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/v17/*', async (req, res) => {
  try {
    let path = req.path.replace(/-/g, '');
    
    console.log('=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('Path:', path);
    console.log('Has Auth:', !!req.headers.authorization);
    console.log('Dev Token:', DEVELOPER_TOKEN ? 'Present' : 'Missing');
    
    if (!req.headers.authorization) {
      console.log('ERROR: Missing Authorization header');
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    
    const requestConfig = {
      method: req.method,
      url: `${GOOGLE_ADS_API}${path}`,
      headers: {
        'Authorization': req.headers.authorization,
        'developer-token': DEVELOPER_TOKEN,
        'Content-Type': 'application/json'
      },
      data: req.method !== 'GET' ? req.body : undefined
    };
    
    console.log('Calling:', requestConfig.url);
    
    const response = await axios(requestConfig);
    console.log('Success:', response.status);
    res.json(response.data);
  } catch (error) {
    console.error('=== Error ===');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data));
    console.error('Message:', error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
