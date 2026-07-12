// Navigation and modal helpers (moved from app.js)
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
      if (activeView) activeView.classList.add('active');

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
  const el = document.getElementById(modalId);
  if (el) el.classList.add('active');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

function initModals() {
  // Expense Modal
  const quickAddBtn = document.getElementById('quick-add-expense-btn');
  if (quickAddBtn) quickAddBtn.addEventListener('click', () => {
    const form = document.getElementById('expense-form');
    if (form) form.reset();
    const expDate = document.getElementById('exp-date');
    if (expDate) expDate.value = new Date().toISOString().split('T')[0];
    const title = document.getElementById('expense-modal-title');
    if (title) title.textContent = 'Log Expense';
    if (form) delete form.dataset.editId;
    openModal('expense-modal');
  });

  const addExpenseTabBtn = document.getElementById('add-expense-tab-btn');
  if (addExpenseTabBtn) addExpenseTabBtn.addEventListener('click', () => {
    const form = document.getElementById('expense-form');
    if (form) form.reset();
    const expDate = document.getElementById('exp-date');
    if (expDate) expDate.value = new Date().toISOString().split('T')[0];
    const title = document.getElementById('expense-modal-title');
    if (title) title.textContent = 'Log Expense';
    if (form) delete form.dataset.editId;
    openModal('expense-modal');
  });

  const closeExpense = document.getElementById('close-expense-modal');
  if (closeExpense) closeExpense.addEventListener('click', () => closeModal('expense-modal'));
  const cancelExpense = document.getElementById('cancel-expense-btn');
  if (cancelExpense) cancelExpense.addEventListener('click', () => closeModal('expense-modal'));

  // Credit Card Modal
  const addCCBtn = document.getElementById('add-credit-card-btn');
  if (addCCBtn) addCCBtn.addEventListener('click', () => {
    const form = document.getElementById('cc-form');
    if (form) form.reset();
    openModal('cc-modal');
  });
  const closeCC = document.getElementById('close-cc-modal');
  if (closeCC) closeCC.addEventListener('click', () => closeModal('cc-modal'));
  const cancelCC = document.getElementById('cancel-cc-btn');
  if (cancelCC) cancelCC.addEventListener('click', () => closeModal('cc-modal'));

  // Cash Modal
  const editCash = document.getElementById('edit-cash-btn');
  if (editCash) editCash.addEventListener('click', () => {
    const input = document.getElementById('cash-amount-input');
    if (input) input.value = window.state ? window.state.cash : 0;
    openModal('cash-modal');
  });
  const closeCash = document.getElementById('close-cash-modal');
  if (closeCash) closeCash.addEventListener('click', () => closeModal('cash-modal'));
  const cancelCash = document.getElementById('cancel-cash-btn');
  if (cancelCash) cancelCash.addEventListener('click', () => closeModal('cash-modal'));

  // Card Payment Modal Close
  const closeCCPay = document.getElementById('close-cc-pay-modal');
  if (closeCCPay) closeCCPay.addEventListener('click', () => closeModal('cc-payment-modal'));
  const cancelCCPay = document.getElementById('cancel-cc-pay-btn');
  if (cancelCCPay) cancelCCPay.addEventListener('click', () => closeModal('cc-payment-modal'));
}

function populatePaymentDropdowns() {
  const expensePayment = document.getElementById('exp-payment');
  const expenseFilterPayment = document.getElementById('expense-filter-payment');

  if (!expensePayment || !expenseFilterPayment) return;

  // Reset to default options
  expensePayment.innerHTML = '<option value="Cash">Cash</option>';
  expenseFilterPayment.innerHTML = '<option value="">All Payment Methods</option><option value="Cash">Cash</option>';

  // Append credit cards
  (window.state && window.state.cards || []).forEach(card => {
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
