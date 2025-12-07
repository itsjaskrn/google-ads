const express = require('express');
const { GoogleAdsApi } = require('google-ads-api');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DEVELOPER_TOKEN = process.env.DEVELOPER_TOKEN || 'IEnKgnvxZWs6VCdF8h8NPw';

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Google Ads gRPC Gateway' });
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
    const axios = require('axios');
    const params = new URLSearchParams(req.body);
    const response = await axios.post('https://oauth2.googleapis.com/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.post('/v17/customers/:customerId/googleAds\\:search', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { query, pageSize } = req.body;
    
    console.log('Search request:', customerId, query);
    
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const accessToken = req.headers.authorization.replace('Bearer ', '');
    
    const client = new GoogleAdsApi({
      client_id: process.env.CLIENT_ID || '',
      client_secret: process.env.CLIENT_SECRET || '',
      developer_token: DEVELOPER_TOKEN
    });

    const customer = client.Customer({
      customer_id: customerId.replace(/-/g, ''),
      access_token: accessToken
    });

    const results = await customer.query(query, { page_size: pageSize || 100 });
    
    res.json({ results });
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    res.status(500).json({ error: error.message, details: error.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`gRPC Gateway running on port ${PORT}`));
