// Minimal Plaid Link client glue
async function createLinkToken() {
  const res = await fetch('/api/create_link_token', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  const data = await res.json();
  return data.link_token;
}

async function initPlaidLink() {
  const linkToken = await createLinkToken();
  if (!linkToken) return;

  const handler = Plaid.create({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      // Exchange public token for access token server-side
      const res = await fetch('/api/exchange_public_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token })
      });
      const data = await res.json();
      console.log('Exchange result', data);
      // Optionally fetch accounts/transactions using returned access_token (store server-side instead)
      alert('Account linked (Sandbox). You can now use the app to add this account as a payment method.');
      // Refresh UI or fetch accounts
      refreshUI();
    },
    onExit: (err, metadata) => {
      if (err) console.error('Plaid Link error', err);
    }
  });

  handler.open();
}

// Attach to a button if present
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('connect-bank-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      initPlaidLink();
    });
  }
});
