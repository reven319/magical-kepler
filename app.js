// Lightweight bootstrap for PocketBooks — uses modular files
// This file wires together state, navigation, forms, and renderers.

// Refresh all sections of the UI
function refreshUI() {
  renderDashboard();
  renderExpenses();
  renderCards();
  renderRent();
  populatePaymentDropdowns();
}

// Initialize app once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initNavigation();
  initModals();
  initForms();
  
  // Set current date in expense input by default
  const today = new Date().toISOString().split('T')[0];
  const expDate = document.getElementById('exp-date');
  if (expDate) expDate.value = today;

  // Initial render
  refreshUI();
});
