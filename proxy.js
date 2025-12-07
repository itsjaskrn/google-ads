const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const DEVELOPER_TOKEN = process.env.DEVELOPER_TOKEN || 'IEnKgnvxZWs6VCdF8h8NPw';
const GOOGLE_ADS_API = 'https://googleads.googleapis.com';

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
