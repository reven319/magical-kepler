// Form handlers (moved from app.js)
function initForms() {
  // Cash Balance adjustment
  const cashForm = document.getElementById('cash-form');
  if (cashForm) cashForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newAmt = parseFloat(document.getElementById('cash-amount-input').value);
    if (!isNaN(newAmt)) {
      window.state.cash = newAmt;
      window.saveState();
      refreshUI();
      closeModal('cash-modal');
    }
  });

  // Credit Card Creation
  const ccForm = document.getElementById('cc-form');
  if (ccForm) ccForm.addEventListener('submit', (e) => {
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

      window.state.cards.push(newCard);
      window.saveState();
      refreshUI();
      closeModal('cc-modal');
    }
  });

  // Expense Add / Edit Creation
  const expenseForm = document.getElementById('expense-form');
  if (expenseForm) expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('exp-desc').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const date = document.getElementById('exp-date').value;
    const category = document.getElementById('exp-category').value;
    const payment = document.getElementById('exp-payment').value;

    const editId = expenseForm.dataset.editId;

    if (desc && !isNaN(amount) && date) {
      if (editId) {
        // Edit Mode
        const idx = window.state.expenses.findIndex(item => item.id === editId);
        if (idx !== -1) {
          const oldExpense = window.state.expenses[idx];

          // Revert old transaction implications on cash / card balance
          window.revertTransactionImplications(oldExpense);

          // Update transaction
          window.state.expenses[idx] = { id: editId, desc, amount, date, category, payment };

          // Apply new transaction implications
          window.applyTransactionImplications(window.state.expenses[idx]);
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
        window.state.expenses.push(newExpense);

        // Apply implications
        window.applyTransactionImplications(newExpense);
      }

      window.saveState();
      refreshUI();
      closeModal('expense-modal');
    }
  });

  // Card Payment Record
  const ccPayForm = document.getElementById('cc-payment-form');
  if (ccPayForm) ccPayForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cardId = document.getElementById('cc-pay-id').value;
    const amount = parseFloat(document.getElementById('cc-pay-amount').value);
    const source = document.getElementById('cc-pay-source').value;

    if (!cardId || isNaN(amount) || amount <= 0) return;

    const card = window.state.cards.find(c => c.id === cardId);
    if (!card) return;

    if (amount > window.state.cash && source === 'Cash') {
      alert("Insufficient Cash reserves to perform this payment.");
      return;
    }

    // Process payment
    card.balance = Math.max(0, card.balance - amount);
    if (source === 'Cash') {
      window.state.cash -= amount;
    }

    // Add a transfer log (represented as a negative expense or category transfer for transparency)
    window.state.expenses.push({
      id: 'exp-pay-' + Date.now(),
      desc: `Paid Card: ${card.name}`,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      category: 'Utilities', // Categorize card payments under general bills/utilities
      payment: 'Cash'
    });

    window.saveState();
    refreshUI();
    closeModal('cc-payment-modal');
  });

  // Rent configuration updates
  const rentForm = document.getElementById('rent-config-form');
  if (rentForm) rentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('rent-amount-input').value);
    const dueDay = parseInt(document.getElementById('rent-due-day').value);

    if (!isNaN(amount) && !isNaN(dueDay)) {
      window.state.rentConfig.amount = amount;
      window.state.rentConfig.dueDay = dueDay;
      window.saveState();
      refreshUI();
      alert('Rent details saved!');
    }
  });

  // Manual payment of Rent
  const payRentBtn = document.getElementById('pay-rent-btn');
  if (payRentBtn) payRentBtn.addEventListener('click', () => {
    const currentDate = new Date();
    const currentMonthStr = currentDate.toLocaleString('default', { month: 'long' });
    const currentYearNum = currentDate.getFullYear();

    // Check if rent is already paid for current month/year
    const alreadyPaid = window.state.rentPayments.some(p => p.month === currentMonthStr && p.year === currentYearNum);
    if (alreadyPaid) {
      alert(`Rent for ${currentMonthStr} ${currentYearNum} has already been recorded.`);
      return;
    }

    if (window.state.cash < window.state.rentConfig.amount) {
      alert("Insufficient cash reserves to pay rent.");
      return;
    }

    // Record Rent Expense
    const rentExpense = {
      id: 'exp-rent-' + Date.now(),
      desc: `Rent Payment - ${currentMonthStr} ${currentYearNum}`,
      amount: window.state.rentConfig.amount,
      date: currentDate.toISOString().split('T')[0],
      category: 'Rent',
      payment: 'Cash'
    };

    window.state.expenses.push(rentExpense);
    window.state.cash -= window.state.rentConfig.amount;

    // Save in rent payments database
    window.state.rentPayments.push({
      id: 'rent-pay-' + Date.now(),
      month: currentMonthStr,
      year: currentYearNum,
      amount: window.state.rentConfig.amount,
      date: currentDate.toISOString().split('T')[0]
    });

    window.saveState();
    refreshUI();
  });
}
