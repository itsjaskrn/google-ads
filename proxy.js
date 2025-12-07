const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const axios = require('axios');
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
    
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const accessToken = req.headers.authorization.replace('Bearer ', '');
    
    const packageDefinition = protoLoader.loadSync(
      require.resolve('google-ads-api/protos/google_ads_service.proto'),
      { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true }
    );
    
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const GoogleAdsService = protoDescriptor.google.ads.googleads.v17.services.GoogleAdsService;
    
    const metadata = new grpc.Metadata();
    metadata.add('authorization', `Bearer ${accessToken}`);
    metadata.add('developer-token', DEVELOPER_TOKEN);
    metadata.add('login-customer-id', customerId.replace(/-/g, ''));
    
    const client = new GoogleAdsService(
      'googleads.googleapis.com:443',
      grpc.credentials.createSsl()
    );
    
    const request = {
      customer_id: customerId.replace(/-/g, ''),
      query: query,
      page_size: pageSize || 100
    };
    
    client.Search(request, metadata, (error, response) => {
      if (error) {
        console.error('gRPC Error:', error);
        return res.status(500).json({ error: error.message });
      }
      res.json({ results: response.results || [] });
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`gRPC Gateway running on port ${PORT}`));
