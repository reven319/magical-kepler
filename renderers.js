// Rendering functions (moved from app.js)
function renderDashboard() {
  // Header Info
  document.getElementById('total-cash').textContent = formatCurrency(window.state.cash);
  
  // Outstanding CC Balance
  const totalDebt = window.state.cards.reduce((sum, c) => sum + c.balance, 0);
  document.getElementById('cc-debt-val').textContent = formatCurrency(totalDebt);

  const totalLimit = window.state.cards.reduce((sum, c) => sum + c.limit, 0);
  const totalAvailable = Math.max(0, totalLimit - totalDebt);
  document.getElementById('cc-limits-val').textContent = `Limit Available: ${formatCurrency(totalAvailable)}`;

  // Net Worth Card
  const netWorth = window.state.cash - totalDebt;
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
  const monthlyExpensesSum = window.state.expenses
    .filter(e => {
      const d = new Date(e.date + 'T00:00:00'); // Prevent timezone shift issues
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !e.desc.startsWith('Paid Card:');
    })
    .reduce((sum, e) => sum + e.amount, 0);

  document.getElementById('month-spending-val').textContent = formatCurrency(monthlyExpensesSum);

  // Rent status card
  const currentMonthStr = currentDate.toLocaleString('default', { month: 'long' });
  const rentPaidThisMonth = window.state.rentPayments.some(p => p.month === currentMonthStr && p.year === currentYear);
  const rentStatusEl = document.getElementById('rent-status-val');

  if (rentPaidThisMonth) {
    rentStatusEl.textContent = 'Paid';
    rentStatusEl.className = 'stat-value text-success';
  } else {
    rentStatusEl.textContent = 'Unpaid';
    rentStatusEl.className = 'stat-value text-danger';
  }
  document.getElementById('rent-due-val').textContent = `Due on the ${window.state.rentConfig.dueDay}st: ${formatCurrency(window.state.rentConfig.amount)}`;

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
    return window.state.expenses
      .filter(e => e.category === cat && !e.desc.startsWith('Paid Card:'))
      .reduce((sum, e) => sum + e.amount, 0);
  });

  const chartCanvas = document.getElementById('categoryChart');
  
  if (window.categoryChart) {
    window.categoryChart.destroy();
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

  window.categoryChart = new Chart(chartCanvas, {
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
  const sorted = [...window.state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

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
        <div class="tx-category-badge badge-${item.category}">${'${iconLetter}'}</div>
        <div class="tx-info">
          <h4>${'${escapeHTML(item.desc)}'}</h4>
          <span>${'${item.date}'}</span>
        </div>
      </div>
      <div class="tx-details">
        <div class="tx-amount">${'${formatCurrency(item.amount)}'}</div>
        <div class="tx-method">${'${escapeHTML(item.payment)}'}</div>
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

  const filtered = window.state.expenses.filter(e => {
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
      <td>${'${item.date}'}</td>
      <td style="font-weight: 500;">${'${escapeHTML(item.desc)}'}</td>
      <td><span class="tx-method badge-${'${item.category}'}" style="font-size:0.8rem; padding: 2px 8px; border-radius: 20px;">${'${item.category}'}</span></td>
      <td>${'${escapeHTML(item.payment)}'}</td>
      <td class="text-right" style="font-weight: 700; color: ${'${item.desc.startsWith(\'Paid Card:\') ? "var(--success)" : "var(--text-primary)"}'};">
        ${'${formatCurrency(item.amount)}'}
      </td>
      <td class="text-center">
        <button class="action-btn edit" onclick="editExpense('${'${item.id}'}')" title="Edit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn delete" onclick="deleteExpense('${'${item.id}'}')" title="Delete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Wire up filter change listeners if not done yet
  if (!window.filtersInitialized) {
    const es = document.getElementById('expense-search');
    if (es) es.addEventListener('input', renderExpenses);
    const efc = document.getElementById('expense-filter-category');
    if (efc) efc.addEventListener('change', renderExpenses);
    const efp = document.getElementById('expense-filter-payment');
    if (efp) efp.addEventListener('change', renderExpenses);
    window.filtersInitialized = true;
  }
}

// Edit / Delete handlers
window.editExpense = function(id) {
  const expense = window.state.expenses.find(e => e.id === id);
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

window.deleteExpense = function(id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    const idx = window.state.expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      const exp = window.state.expenses[idx];
      // Revert the transaction implications
      window.revertTransactionImplications(exp);
      
      // Remove expense
      window.state.expenses.splice(idx, 1);
      window.saveState();
      refreshUI();
    }
  }
};

// Cards rendering and handlers
function renderCards() {
  const grid = document.getElementById('credit-cards-grid');
  grid.innerHTML = '';

  if (window.state.cards.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No credit cards added yet. Click "+ Add Credit Card" above to register a card.</div>';
    return;
  }

  window.state.cards.forEach(card => {
    const container = document.createElement('div');
    container.className = `cc-glow-container ${card.color}`;

    const remainingLimit = Math.max(0, card.limit - card.balance);
    const utilization = card.limit > 0 ? Math.round((card.balance / card.limit) * 100) : 0;

    container.innerHTML = `
      <div class="cc-digital-card">
        <div class="cc-decor"></div>
        <div class="cc-top">
          <div class="cc-bank">${'${escapeHTML(card.name)}'}</div>
          <div class="cc-chip"></div>
        </div>
        <div class="cc-middle">
          <div class="cc-label">Outstanding Balance</div>
          <div class="cc-val">${'${formatCurrency(card.balance)}'}</div>
        </div>
        <div class="cc-bottom">
          <div class="cc-limit-txt">
            <div>Limit: ${'${formatCurrency(card.limit)}'}</div>
            <div style="font-size:0.75rem; opacity:0.8;">Avail: ${'${formatCurrency(remainingLimit)}'} (${ ' + utilization + ' }% Util)</div>
          </div>
          <div class="cc-due-badge">Due: Day ${'${card.dueDay}'}</div>
        </div>
      </div>
      <div class="cc-card-actions">
        <button class="btn btn-secondary" onclick="openPayCCModal('${'${card.id}'}')">Pay Card</button>
        <button class="btn btn-danger" onclick="deleteCC('${'${card.id}'}')" style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239,68,68,0.25);">Delete Card</button>
      </div>
    `;
    grid.appendChild(container);
  });
}

window.openPayCCModal = function(id) {
  const card = window.state.cards.find(c => c.id === id);
  if (!card) return;

  document.getElementById('cc-pay-id').value = card.id;
  document.getElementById('cc-pay-name').textContent = card.name;
  document.getElementById('cc-pay-amount').value = card.balance.toFixed(2);
  document.getElementById('cc-pay-help-text').textContent = `Outstanding Balance: ${formatCurrency(card.balance)}`;
  
  openModal('cc-payment-modal');
};

window.deleteCC = function(id) {
  if (confirm("Deleting this card does NOT clear transactions paid with it, but will remove it from card tracker. Proceed?")) {
    const idx = window.state.cards.findIndex(c => c.id === id);
    if (idx !== -1) {
      window.state.cards.splice(idx, 1);
      window.saveState();
      refreshUI();
    }
  }
};

function renderRent() {
  // Config fields
  const rentAmountInput = document.getElementById('rent-amount-input');
  const rentDueInput = document.getElementById('rent-due-day');
  if (rentAmountInput) rentAmountInput.value = window.state.rentConfig.amount;
  if (rentDueInput) rentDueInput.value = window.state.rentConfig.dueDay;

  // Month Title and Status box
  const currentDate = new Date();
  const currentMonthStr = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const rentMonthLabel = document.getElementById('rent-month-label');
  if (rentMonthLabel) rentMonthLabel.textContent = `Rent for ${currentMonthStr} ${currentYear}`;
  const rentDetailsDesc = document.getElementById('rent-details-desc');
  if (rentDetailsDesc) rentDetailsDesc.textContent = `Amount: ${formatCurrency(window.state.rentConfig.amount)} | Due: ${currentMonthStr} ${window.state.rentConfig.dueDay}st`;

  // Paid Status Indicator
  const isPaid = window.state.rentPayments.some(p => p.month === currentMonthStr && p.year === currentYear);
  const statusBox = document.getElementById('rent-status-box');
  const indicator = statusBox ? statusBox.querySelector('.status-indicator') : null;
  const payBtn = document.getElementById('pay-rent-btn');

  if (indicator) {
    if (isPaid) {
      indicator.textContent = 'Paid';
      indicator.className = 'status-indicator paid';
      if (payBtn) payBtn.style.display = 'none';
    } else {
      indicator.textContent = 'Unpaid';
      indicator.className = 'status-indicator unpaid';
      if (payBtn) payBtn.style.display = 'block';
    }
  }

  // Render Rent History list
  const historyList = document.getElementById('rent-history-list');
  if (!historyList) return;
  historyList.innerHTML = '';

  // Sort history descending
  const sortedRent = [...window.state.rentPayments].sort((a, b) => new Date(b.date) - new Date(a.date));

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
