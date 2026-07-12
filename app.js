// State Management
let state = {
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

// Load State from LocalStorage
function loadState() {
  const savedState = localStorage.getItem('pocketbooks_state');
  if (savedState) {
    try {
      state = JSON.parse(savedState);
    } catch (e) {
      console.error('Failed to parse local storage state, using default mock data.', e);
    }
  } else {
    saveState(); // Save default mock data
  }
}

// Save State to LocalStorage
function saveState() {
  localStorage.setItem('pocketbooks_state', JSON.stringify(state));
}

// Global Chart Instance
let categoryChart = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initNavigation();
  initModals();
  initForms();
  
  // Set current date in expense input by default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('exp-date').value = today;

  // Initial render
  refreshUI();
});

// Refresh all sections of the UI
function refreshUI() {
  renderDashboard();
  renderExpenses();
  renderCards();
  renderRent();
  populatePaymentDropdowns();
}

// Navigation Tabs
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabViews = document.querySelectorAll('.tab-view');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      // Update sidebar active classes
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update active tab views
      tabViews.forEach(view => view.classList.remove('active'));
      const activeView = document.getElementById(`tab-${targetTab}`);
      activeView.classList.add('active');

      // Update Title
      switch(targetTab) {
        case 'dashboard':
          pageTitle.textContent = 'Dashboard Overview';
          break;
        case 'expenses':
          pageTitle.textContent = 'Expenses Ledger';
          break;
        case 'cards':
          pageTitle.textContent = 'Credit Card Manager';
          break;
        case 'rent':
          pageTitle.textContent = 'Rent & Housing Tracker';
          break;
      }
    });
  });

  // Setup 'View All' links inside dashboards
  document.querySelectorAll('.btn-view-all').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-target-tab');
      const targetNavItem = document.querySelector(`.nav-item[data-tab="${targetTab}"]`);
      if (targetNavItem) targetNavItem.click();
    });
  });
}

// Modal Toggle Helper Functions
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function initModals() {
  // Expense Modal
  document.getElementById('quick-add-expense-btn').addEventListener('click', () => {
    document.getElementById('expense-form').reset();
    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-modal-title').textContent = 'Log Expense';
    // Remove temporary edit tracking ID
    delete document.getElementById('expense-form').dataset.editId;
    openModal('expense-modal');
  });

  document.getElementById('add-expense-tab-btn').addEventListener('click', () => {
    document.getElementById('expense-form').reset();
    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-modal-title').textContent = 'Log Expense';
    delete document.getElementById('expense-form').dataset.editId;
    openModal('expense-modal');
  });

  document.getElementById('close-expense-modal').addEventListener('click', () => closeModal('expense-modal'));
  document.getElementById('cancel-expense-btn').addEventListener('click', () => closeModal('expense-modal'));

  // Credit Card Modal
  document.getElementById('add-credit-card-btn').addEventListener('click', () => {
    document.getElementById('cc-form').reset();
    openModal('cc-modal');
  });
  document.getElementById('close-cc-modal').addEventListener('click', () => closeModal('cc-modal'));
  document.getElementById('cancel-cc-btn').addEventListener('click', () => closeModal('cc-modal'));

  // Cash Modal
  document.getElementById('edit-cash-btn').addEventListener('click', () => {
    document.getElementById('cash-amount-input').value = state.cash;
    openModal('cash-modal');
  });
  document.getElementById('close-cash-modal').addEventListener('click', () => closeModal('cash-modal'));
  document.getElementById('cancel-cash-btn').addEventListener('click', () => closeModal('cash-modal'));

  // Card Payment Modal Close
  document.getElementById('close-cc-pay-modal').addEventListener('click', () => closeModal('cc-payment-modal'));
  document.getElementById('cancel-cc-pay-btn').addEventListener('click', () => closeModal('cc-payment-modal'));
}

// Dropdown Populators
function populatePaymentDropdowns() {
  const expensePayment = document.getElementById('exp-payment');
  const expenseFilterPayment = document.getElementById('expense-filter-payment');

  // Reset to default options
  expensePayment.innerHTML = '<option value="Cash">Cash</option>';
  expenseFilterPayment.innerHTML = '<option value="">All Payment Methods</option><option value="Cash">Cash</option>';

  // Append credit cards
  state.cards.forEach(card => {
    const option1 = document.createElement('option');
    option1.value = card.name;
    option1.textContent = card.name;
    expensePayment.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = card.name;
    option2.textContent = card.name;
    expenseFilterPayment.appendChild(option2);
  });
}

// Form Submission Handlers
function initForms() {
  // Cash Balance adjustment
  document.getElementById('cash-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newAmt = parseFloat(document.getElementById('cash-amount-input').value);
    if (!isNaN(newAmt)) {
      state.cash = newAmt;
      saveState();
      refreshUI();
      closeModal('cash-modal');
    }
  });

  // Credit Card Creation
  document.getElementById('cc-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cc-name').value.trim();
    const limit = parseFloat(document.getElementById('cc-limit').value);
    const balance = parseFloat(document.getElementById('cc-balance').value) || 0;
    const dueDay = parseInt(document.getElementById('cc-due-day').value);
    const color = document.getElementById('cc-color').value;

    if (name && !isNaN(limit) && !isNaN(dueDay)) {
      const newCard = {
        id: 'card-' + Date.now(),
        name,
        limit,
        balance,
        dueDay,
        color
      };

      state.cards.push(newCard);
      saveState();
      refreshUI();
      closeModal('cc-modal');
    }
  });

  // Expense Add / Edit Creation
  document.getElementById('expense-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('exp-desc').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const date = document.getElementById('exp-date').value;
    const category = document.getElementById('exp-category').value;
    const payment = document.getElementById('exp-payment').value;
    
    const editId = document.getElementById('expense-form').dataset.editId;

    if (desc && !isNaN(amount) && date) {
      if (editId) {
        // Edit Mode
        const idx = state.expenses.findIndex(item => item.id === editId);
        if (idx !== -1) {
          const oldExpense = state.expenses[idx];
          
          // Revert old transaction implications on cash / card balance
          revertTransactionImplications(oldExpense);

          // Update transaction
          state.expenses[idx] = { id: editId, desc, amount, date, category, payment };
          
          // Apply new transaction implications
          applyTransactionImplications(state.expenses[idx]);
        }
      } else {
        // Add Mode
        const newExpense = {
          id: 'exp-' + Date.now(),
          desc,
          amount,
          date,
          category,
          payment
        };
        state.expenses.push(newExpense);
        
        // Apply implications
        applyTransactionImplications(newExpense);
      }

      saveState();
      refreshUI();
      closeModal('expense-modal');
    }
  });

  // Card Payment Record
  document.getElementById('cc-payment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const cardId = document.getElementById('cc-pay-id').value;
    const amount = parseFloat(document.getElementById('cc-pay-amount').value);
    const source = document.getElementById('cc-pay-source').value;

    if (!cardId || isNaN(amount) || amount <= 0) return;

    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    if (amount > state.cash && source === 'Cash') {
      alert("Insufficient Cash reserves to perform this payment.");
      return;
    }

    // Process payment
    card.balance = Math.max(0, card.balance - amount);
    if (source === 'Cash') {
      state.cash -= amount;
    }

    // Add a transfer log (represented as a negative expense or category transfer for transparency)
    state.expenses.push({
      id: 'exp-pay-' + Date.now(),
      desc: `Paid Card: ${card.name}`,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      category: 'Utilities', // Categorize card payments under general bills/utilities
      payment: 'Cash'
    });

    saveState();
    refreshUI();
    closeModal('cc-payment-modal');
  });

  // Rent configuration updates
  document.getElementById('rent-config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('rent-amount-input').value);
    const dueDay = parseInt(document.getElementById('rent-due-day').value);

    if (!isNaN(amount) && !isNaN(dueDay)) {
      state.rentConfig.amount = amount;
      state.rentConfig.dueDay = dueDay;
      saveState();
      refreshUI();
      alert('Rent details saved!');
    }
  });

  // Manual payment of Rent
  document.getElementById('pay-rent-btn').addEventListener('click', () => {
    const currentDate = new Date();
    const currentMonthStr = currentDate.toLocaleString('default', { month: 'long' });
    const currentYearNum = currentDate.getFullYear();

    // Check if rent is already paid for current month/year
    const alreadyPaid = state.rentPayments.some(p => p.month === currentMonthStr && p.year === currentYearNum);
    if (alreadyPaid) {
      alert(`Rent for ${currentMonthStr} ${currentYearNum} has already been recorded.`);
      return;
    }

    if (state.cash < state.rentConfig.amount) {
      alert("Insufficient cash reserves to pay rent.");
      return;
    }

    // Record Rent Expense
    const rentExpense = {
      id: 'exp-rent-' + Date.now(),
      desc: `Rent Payment - ${currentMonthStr} ${currentYearNum}`,
      amount: state.rentConfig.amount,
      date: currentDate.toISOString().split('T')[0],
      category: 'Rent',
      payment: 'Cash'
    };

    state.expenses.push(rentExpense);
    state.cash -= state.rentConfig.amount;

    // Save in rent payments database
    state.rentPayments.push({
      id: 'rent-pay-' + Date.now(),
      month: currentMonthStr,
      year: currentYearNum,
      amount: state.rentConfig.amount,
      date: currentDate.toISOString().split('T')[0]
    });

    saveState();
    refreshUI();
  });
}

// Helpers to handle double-entry updates
function applyTransactionImplications(expense) {
  if (expense.payment === 'Cash') {
    state.cash -= expense.amount;
  } else {
    // Payment is a credit card
    const card = state.cards.find(c => c.name === expense.payment);
    if (card) {
      card.balance += expense.amount;
    }
  }
}

function revertTransactionImplications(expense) {
  if (expense.payment === 'Cash') {
    state.cash += expense.amount;
  } else {
    const card = state.cards.find(c => c.name === expense.payment);
    if (card) {
      card.balance = Math.max(0, card.balance - expense.amount);
    }
  }
}

// Tab: Rendering Dashboard
function renderDashboard() {
  // Header Info
  document.getElementById('total-cash').textContent = formatCurrency(state.cash);
  
  // Outstanding CC Balance
  const totalDebt = state.cards.reduce((sum, c) => sum + c.balance, 0);
  document.getElementById('cc-debt-val').textContent = formatCurrency(totalDebt);

  const totalLimit = state.cards.reduce((sum, c) => sum + c.limit, 0);
  const totalAvailable = Math.max(0, totalLimit - totalDebt);
  document.getElementById('cc-limits-val').textContent = `Limit Available: ${formatCurrency(totalAvailable)}`;

  // Net Worth Card
  const netWorth = state.cash - totalDebt;
  const netWorthEl = document.getElementById('net-worth-val');
  netWorthEl.textContent = formatCurrency(netWorth);
  if (netWorth < 0) {
    netWorthEl.className = 'stat-value text-danger';
  } else {
    netWorthEl.className = 'stat-value text-success';
  }

  // Monthly Spending Card
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter expenses matching current month/year (ignoring payment entries that log cash CC payments to avoid double-counting)
  const monthlyExpensesSum = state.expenses
    .filter(e => {
      const d = new Date(e.date + 'T00:00:00'); // Prevent timezone shift issues
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !e.desc.startsWith('Paid Card:');
    })
    .reduce((sum, e) => sum + e.amount, 0);

  document.getElementById('month-spending-val').textContent = formatCurrency(monthlyExpensesSum);

  // Rent status card
  const currentMonthStr = currentDate.toLocaleString('default', { month: 'long' });
  const rentPaidThisMonth = state.rentPayments.some(p => p.month === currentMonthStr && p.year === currentYear);
  const rentStatusEl = document.getElementById('rent-status-val');

  if (rentPaidThisMonth) {
    rentStatusEl.textContent = 'Paid';
    rentStatusEl.className = 'stat-value text-success';
  } else {
    rentStatusEl.textContent = 'Unpaid';
    rentStatusEl.className = 'stat-value text-danger';
  }
  document.getElementById('rent-due-val').textContent = `Due on the ${state.rentConfig.dueDay}st: ${formatCurrency(state.rentConfig.amount)}`;

  // Render Category Chart
  renderChartData();

  // Render recent transactions feed
  renderRecentTransactions();
}

// Render Dashboard Chart
function renderChartData() {
  const categories = ['Food', 'Rent', 'Shopping', 'Utilities', 'Travel', 'Other'];
  
  // Calculate expenses sums per category
  const sums = categories.map(cat => {
    return state.expenses
      .filter(e => e.category === cat && !e.desc.startsWith('Paid Card:'))
      .reduce((sum, e) => sum + e.amount, 0);
  });

  const chartCanvas = document.getElementById('categoryChart');
  
  if (categoryChart) {
    categoryChart.destroy();
  }

  // Check if there are expenses to display
  const totalSpend = sums.reduce((a, b) => a + b, 0);
  if (totalSpend === 0) {
    const ctx = chartCanvas.getContext('2d');
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    // Draw placeholder text
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No spending logged yet.', chartCanvas.width / 2, chartCanvas.height / 2);
    return;
  }

  categoryChart = new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: sums,
        backgroundColor: [
          '#10b981', // Food (Green)
          '#3b82f6', // Rent (Blue)
          '#f59e0b', // Shopping (Yellow)
          '#ef4444', // Utilities (Red)
          '#8a2be2', // Travel (Purple)
          '#64748b'  // Other (Slate)
        ],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: {
              family: 'Inter',
              size: 11
            }
          }
        }
      },
      cutout: '60%'
    }
  });
}

function renderRecentTransactions() {
  const container = document.getElementById('recent-transactions-list');
  container.innerHTML = '';

  // Sort expenses by date descending
  const sorted = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state">No transactions recorded yet.</div>';
    return;
  }

  sorted.forEach(item => {
    const div = document.createElement('div');
    div.className = 'transaction-item';

    // Get letter abbreviation or emoji for categories
    let iconLetter = item.category.charAt(0);
    
    div.innerHTML = `
      <div class="tx-icon-desc">
        <div class="tx-category-badge badge-${item.category}">${iconLetter}</div>
        <div class="tx-info">
          <h4>${escapeHTML(item.desc)}</h4>
          <span>${item.date}</span>
        </div>
      </div>
      <div class="tx-details">
        <div class="tx-amount">${formatCurrency(item.amount)}</div>
        <div class="tx-method">${escapeHTML(item.payment)}</div>
      </div>
    `;
    container.appendChild(div);
  });
}

// Tab: Rendering Expenses Ledger
function renderExpenses() {
  const tableBody = document.getElementById('expense-table-body');
  const emptyState = document.getElementById('expense-empty-state');
  tableBody.innerHTML = '';

  const search = document.getElementById('expense-search').value.toLowerCase();
  const filterCategory = document.getElementById('expense-filter-category').value;
  const filterPayment = document.getElementById('expense-filter-payment').value;

  const filtered = state.expenses.filter(e => {
    const matchesSearch = e.desc.toLowerCase().includes(search);
    const matchesCategory = filterCategory === '' || e.category === filterCategory;
    const matchesPayment = filterPayment === '' || e.payment === filterPayment;
    return matchesSearch && matchesCategory && matchesPayment;
  });

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.date}</td>
      <td style="font-weight: 500;">${escapeHTML(item.desc)}</td>
      <td><span class="tx-method badge-${item.category}" style="font-size:0.8rem; padding: 2px 8px; border-radius: 20px;">${item.category}</span></td>
      <td>${escapeHTML(item.payment)}</td>
      <td class="text-right" style="font-weight: 700; color: ${item.desc.startsWith('Paid Card:') ? 'var(--success)' : 'var(--text-primary)'};">
        ${formatCurrency(item.amount)}
      </td>
      <td class="text-center">
        <button class="action-btn edit" onclick="editExpense('${item.id}')" title="Edit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn delete" onclick="deleteExpense('${item.id}')" title="Delete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Wire up filter change listeners if not done yet
  if (!window.filtersInitialized) {
    document.getElementById('expense-search').addEventListener('input', renderExpenses);
    document.getElementById('expense-filter-category').addEventListener('change', renderExpenses);
    document.getElementById('expense-filter-payment').addEventListener('change', renderExpenses);
    window.filtersInitialized = true;
  }
}

// Edit Expense Handler
window.editExpense = function(id) {
  const expense = state.expenses.find(e => e.id === id);
  if (!expense) return;

  // Pre-fill form fields
  document.getElementById('exp-desc').value = expense.desc;
  document.getElementById('exp-amount').value = expense.amount;
  document.getElementById('exp-date').value = expense.date;
  document.getElementById('exp-category').value = expense.category;
  document.getElementById('exp-payment').value = expense.payment;

  // Track ID being edited inside the dataset of the form
  document.getElementById('expense-form').dataset.editId = id;
  document.getElementById('expense-modal-title').textContent = 'Modify Transaction';

  openModal('expense-modal');
};

// Delete Expense Handler
window.deleteExpense = function(id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    const idx = state.expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      const exp = state.expenses[idx];
      // Revert the transaction implications
      revertTransactionImplications(exp);
      
      // Remove expense
      state.expenses.splice(idx, 1);
      saveState();
      refreshUI();
    }
  }
};

// Tab: Rendering Credit Cards
function renderCards() {
  const grid = document.getElementById('credit-cards-grid');
  grid.innerHTML = '';

  if (state.cards.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No credit cards added yet. Click "+ Add Credit Card" above to register a card.</div>';
    return;
  }

  state.cards.forEach(card => {
    const container = document.createElement('div');
    container.className = `cc-glow-container ${card.color}`;

    const remainingLimit = Math.max(0, card.limit - card.balance);
    const utilization = card.limit > 0 ? Math.round((card.balance / card.limit) * 100) : 0;

    container.innerHTML = `
      <div class="cc-digital-card">
        <div class="cc-decor"></div>
        <div class="cc-top">
          <div class="cc-bank">${escapeHTML(card.name)}</div>
          <div class="cc-chip"></div>
        </div>
        <div class="cc-middle">
          <div class="cc-label">Outstanding Balance</div>
          <div class="cc-val">${formatCurrency(card.balance)}</div>
        </div>
        <div class="cc-bottom">
          <div class="cc-limit-txt">
            <div>Limit: ${formatCurrency(card.limit)}</div>
            <div style="font-size:0.75rem; opacity:0.8;">Avail: ${formatCurrency(remainingLimit)} (${utilization}% Util)</div>
          </div>
          <div class="cc-due-badge">Due: Day ${card.dueDay}</div>
        </div>
      </div>
      <div class="cc-card-actions">
        <button class="btn btn-secondary" onclick="openPayCCModal('${card.id}')">Pay Card</button>
        <button class="btn btn-danger" onclick="deleteCC('${card.id}')" style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239,68,68,0.25);">Delete Card</button>
      </div>
    `;
    grid.appendChild(container);
  });
}

// CC Payment trigger
window.openPayCCModal = function(id) {
  const card = state.cards.find(c => c.id === id);
  if (!card) return;

  document.getElementById('cc-pay-id').value = card.id;
  document.getElementById('cc-pay-name').textContent = card.name;
  document.getElementById('cc-pay-amount').value = card.balance.toFixed(2);
  document.getElementById('cc-pay-help-text').textContent = `Outstanding Balance: ${formatCurrency(card.balance)}`;
  
  openModal('cc-payment-modal');
};

// CC Delete Trigger
window.deleteCC = function(id) {
  if (confirm("Deleting this card does NOT clear transactions paid with it, but will remove it from card tracker. Proceed?")) {
    const idx = state.cards.findIndex(c => c.id === id);
    if (idx !== -1) {
      state.cards.splice(idx, 1);
      saveState();
      refreshUI();
    }
  }
};

// Tab: Rendering Rent Tracker
function renderRent() {
  // Config fields
  document.getElementById('rent-amount-input').value = state.rentConfig.amount;
  document.getElementById('rent-due-day').value = state.rentConfig.dueDay;

  // Month Title and Status box
  const currentDate = new Date();
  const currentMonthStr = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  document.getElementById('rent-month-label').textContent = `Rent for ${currentMonthStr} ${currentYear}`;
  document.getElementById('rent-details-desc').textContent = `Amount: ${formatCurrency(state.rentConfig.amount)} | Due: ${currentMonthStr} ${state.rentConfig.dueDay}st`;

  // Paid Status Indicator
  const isPaid = state.rentPayments.some(p => p.month === currentMonthStr && p.year === currentYear);
  const statusBox = document.getElementById('rent-status-box');
  const indicator = statusBox.querySelector('.status-indicator');
  const payBtn = document.getElementById('pay-rent-btn');

  if (isPaid) {
    indicator.textContent = 'Paid';
    indicator.className = 'status-indicator paid';
    payBtn.style.display = 'none';
  } else {
    indicator.textContent = 'Unpaid';
    indicator.className = 'status-indicator unpaid';
    payBtn.style.display = 'block';
  }

  // Render Rent History list
  const historyList = document.getElementById('rent-history-list');
  historyList.innerHTML = '';

  // Sort history descending
  const sortedRent = [...state.rentPayments].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sortedRent.length === 0) {
    historyList.innerHTML = '<div class="empty-state">No rent payments logged yet.</div>';
    return;
  }

  sortedRent.forEach(payment => {
    const div = document.createElement('div');
    div.className = 'rent-history-item';
    div.innerHTML = `
      <div class="rent-history-details">
        <h5>Rent Paid - ${payment.month} ${payment.year}</h5>
        <span>Received on ${payment.date}</span>
      </div>
      <div class="rent-history-amount">+ ${formatCurrency(payment.amount)}</div>
    `;
    historyList.appendChild(div);
  });
}

// Utility Formatter Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
