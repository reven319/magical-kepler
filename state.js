// Shared state and utilities (extracted from app.js)
window.state = {
  cash: 3450.00,
  expenses: [
    { id: '1', desc: 'Whole Foods Market', amount: 124.50, date: '2026-06-12', category: 'Food', payment: 'Chase Sapphire' },
    { id: '2', desc: 'Rent Payment', amount: 1500.00, date: '2026-06-01', category: 'Rent', payment: 'Cash' },
    { id: '3', desc: 'Electric Bill', amount: 85.20, date: '2026-06-05', category: 'Utilities', payment: 'Amex Gold' },
    { id: '4', desc: 'Starbucks Coffee', amount: 6.75, date: '2026-06-13', category: 'Food', payment: 'Cash' },
    { id: '5', desc: 'New Sneakers', amount: 110.00, date: '2026-06-10', category: 'Shopping', payment: 'Chase Sapphire' },
    { id: '6', desc: 'Gas Station', amount: 45.00, date: '2026-06-08', category: 'Travel', payment: 'Amex Gold' }
  ],
  cards: [
    { id: 'card-1', name: 'Chase Sapphire', limit: 10000, balance: 234.50, dueDay: 15, color: 'gradient-blue-purple' },
    { id: 'card-2', name: 'Amex Gold', limit: 15000, balance: 130.20, dueDay: 25, color: 'gradient-orange-red' }
  ],
  rentConfig: {
    amount: 1500.00,
    dueDay: 1
  },
  rentPayments: [
    { id: 'rent-pay-1', month: 'June', year: 2026, amount: 1500.00, date: '2026-06-01' },
    { id: 'rent-pay-2', month: 'May', year: 2026, amount: 1500.00, date: '2026-05-01' }
  ]
};

// Persistence helpers
window.loadState = function() {
  const savedState = localStorage.getItem('pocketbooks_state');
  if (savedState) {
    try {
      window.state = JSON.parse(savedState);
    } catch (e) {
      // keep initial mock state if parse fails
      console.error('Failed to parse local storage state, using default mock data.', e);
    }
  } else {
    window.saveState(); // Save default mock data
  }
};

window.saveState = function() {
  localStorage.setItem('pocketbooks_state', JSON.stringify(window.state));
};

// Transaction implications
window.applyTransactionImplications = function(expense) {
  if (expense.payment === 'Cash') {
    window.state.cash -= expense.amount;
  } else {
    const card = window.state.cards.find(c => c.name === expense.payment);
    if (card) card.balance += expense.amount;
  }
};

window.revertTransactionImplications = function(expense) {
  if (expense.payment === 'Cash') {
    window.state.cash += expense.amount;
  } else {
    const card = window.state.cards.find(c => c.name === expense.payment);
    if (card) {
      card.balance = Math.max(0, card.balance - expense.amount);
    }
  }
};

// Utilities
window.formatCurrency = function(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

window.escapeHTML = function(str) {
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
};
