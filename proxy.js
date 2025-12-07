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
    const response = await axios({
      method: req.method,
      url: `${GOOGLE_ADS_API}${req.path}`,
      headers: {
        'Authorization': req.headers.authorization,
        'developer-token': DEVELOPER_TOKEN,
        'Content-Type': 'application/json'
      },
      data: req.body
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
