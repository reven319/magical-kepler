const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || 'YOUR_PLAID_CLIENT_ID';
const PLAID_SECRET = process.env.PLAID_SECRET || 'YOUR_PLAID_SECRET';
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

const env = PLAID_ENV === 'production' ? PlaidEnvironments.production :
            PLAID_ENV === 'development' ? PlaidEnvironments.development :
            PlaidEnvironments.sandbox;

const config = new Configuration({
  basePath: env,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET
    }
  }
});

const client = new PlaidApi(config);

// Simple health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Create a link token for Plaid Link
app.post('/api/create_link_token', async (req, res) => {
  try {
    const clientUserId = req.body.client_user_id || 'user-' + Date.now();
    const response = await client.linkTokenCreate({
      user: { client_user_id: clientUserId },
      client_name: 'PocketBooks',
      products: ['transactions','auth','identity'],
      country_codes: ['US'],
      language: 'en'
    });

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.response ? err.response.data : err.message });
  }
});

// Exchange public_token for access_token
app.post('/api/exchange_public_token', async (req, res) => {
  try {
    const { public_token } = req.body;
    const response = await client.itemPublicTokenExchange({ public_token });
    // response.data.access_token should be stored server-side securely
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.response ? err.response.data : err.message });
  }
});

// Get accounts for an access_token (pass access_token in body)
app.post('/api/accounts', async (req, res) => {
  try {
    const { access_token } = req.body;
    const response = await client.accountsGet({ access_token });
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.response ? err.response.data : err.message });
  }
});

// Get transactions for access_token with date range
app.post('/api/transactions', async (req, res) => {
  try {
    const { access_token, start_date, end_date } = req.body;
    const response = await client.transactionsGet({
      access_token,
      start_date: start_date || '2020-01-01',
      end_date: end_date || new Date().toISOString().split('T')[0],
      options: { count: 250, offset: 0 }
    });
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.response ? err.response.data : err.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Plaid server listening on ${PORT}`));
