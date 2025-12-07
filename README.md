# Google Ads gRPC-to-REST Gateway

Converts Google Ads gRPC API to REST for Custom GPT integration.

## Deploy to Vercel

1. Push to GitHub
2. Go to vercel.com
3. Import repository
4. Add environment variables:
   - `DEVELOPER_TOKEN`: Your Google Ads developer token
   - `CLIENT_ID`: OAuth client ID
   - `CLIENT_SECRET`: OAuth client secret
5. Deploy

## Usage

POST `/v17/customers/{customerId}/googleAds:search`
Body: `{"query": "SELECT campaign.id FROM campaign", "pageSize": 100}`
