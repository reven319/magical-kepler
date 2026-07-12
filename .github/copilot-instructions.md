# Copilot Instructions - PocketBooks

**Quick Navigation:**
- **First time here?** → See [Overview](#overview) and [Architecture](#architecture)
- **Need to understand state flow?** → See [Component Data Flow Diagram](#component-data-flow-diagram)
- **Debugging issues?** → See [Debugging Tips](#debugging-tips) and [Common Gotchas](#common-gotchas--anti-patterns)
- **Adding a feature?** → See [Common Tasks](#common-tasks)
- **Performance concerns?** → See [Performance Considerations](#performance-considerations)
- **Testing?** → See [`.github/mcp-servers.md`](./mcp-servers.md) for Playwright setup
- **General project info?** → See [`README.md`](../README.md)

---

## Overview

PocketBooks is a lightweight personal finance tracker built with vanilla HTML/CSS/JavaScript. It provides features for tracking expenses, managing credit cards, monitoring rent payments, and visualizing spending patterns.

## Project Structure

```
magical-kepler/
├── index.html      # Single-page app structure & layout
├── app.js          # ~27 KB - all application logic
├── styles.css      # ~21 KB - dark-themed UI with CSS variables
```

**Key Pattern:** This is a **monolithic single-page app** — all logic lives in `app.js`. No build process, no module bundling, no node_modules.

## Architecture

### State Management

The app uses a single global `state` object stored in localStorage:

```javascript
state = {
  cash: number,                    // Available cash balance
  expenses: [{ id, desc, amount, date, category, payment }, ...],
  cards: [{ id, name, limit, balance, dueDay, color }, ...],
  rentConfig: { amount, dueDay },
  rentPayments: [{ id, month, year, amount, date }, ...]
}
```

**Data Flow:**
- `loadState()` — Restores state from localStorage on page load
- `saveState()` — Persists state to localStorage after mutations
- `refreshUI()` — Re-renders all visible sections (called after state changes)

### Component Architecture

The app is organized around **four main features**, each with dedicated render functions:

1. **Dashboard** (`renderDashboard`)
   - Category breakdown pie chart (Chart.js)
   - Recent transaction list
   - Quick stats (total expenses, card balance, cash)

2. **Expenses** (`renderExpenses`)
   - Table of all expenses with inline edit/delete
   - Filtering by category & payment method
   - Add/edit via modal form

3. **Credit Cards** (`renderCards`)
   - Card grid displaying limit, balance, due date
   - Payment tracking within each card
   - Add new card via modal form

4. **Rent Tracker** (`renderRent`)
   - Rent payment history
   - Configure monthly rent amount
   - Log rent payments

### UI Patterns

**Modal System:**
- Modals are hidden divs (`<div id="*-modal" class="modal">`)
- `openModal(id)` / `closeModal(id)` manage visibility via CSS class `active`
- Each modal has a form that resets on open

**Event Delegation:**
- Navigation tabs: `.nav-item[data-tab]` attribute specifies target section
- All modals wired via ID selectors in `initModals()`
- Form submissions in `initForms()`

**Transaction Side Effects:**
When an expense is added/edited/deleted, the app automatically:
- Updates card balance if payment method is a credit card (`applyTransactionImplications`)
- Deducts from cash if payment method is "Cash"
- Reverts changes on undo (`revertTransactionImplications`)

## Component Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        state (global)                        │
│  { cash, expenses[], cards[], rentConfig, rentPayments[] }  │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
  localStorage()    refreshUI()
  (persistence)     (re-renders all)
                       │
           ┌───────────┼───────────┬──────────────┐
           │           │           │              │
           ▼           ▼           ▼              ▼
        Dashboard  Expenses    Credit Cards   Rent Tracker
     (renderDashboard) (renderExpenses) (renderCards) (renderRent)
           │           │           │              │
           ├───────────┴───────────┴──────────────┤
           │                                       │
           └──────────────┬──────────────────────┘
                          │
                          ▼
                    DOM re-renders
                    (user sees updates)

User Interaction Flow:
┌─────────────────┐
│  User Action    │ (click button, submit form)
│  (click/submit) │
└────────┬────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │  Event Handler Fires         │
   │  (initModals, initForms)     │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │  Validate & Extract Form     │
   │  Data from DOM               │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │  Apply Side Effects          │
   │  (update balances if needed) │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │  saveState()                 │
   │  (persist to localStorage)   │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │  refreshUI()                 │
   │  (re-render all sections)    │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │  User sees updates           │
   │  in all tabs                 │
   └──────────────────────────────┘
```

## Detailed: Transaction Side Effects System

The `applyTransactionImplications(expense)` and `revertTransactionImplications(expense)` functions handle the critical logic of keeping balances in sync:

```javascript
// When adding a new expense:
1. User submits expense form with: desc, amount, date, category, payment method
2. Expense is added to state.expenses[] with a new ID
3. applyTransactionImplications() is called with the new expense
   - If payment = "Cash" → state.cash -= amount
   - If payment = credit card name → find card in state.cards[] by name
     → card.balance += amount (balance goes up = debt increases)
4. saveState() persists to localStorage
5. refreshUI() re-renders all sections

// When editing an expense (e.g., changing amount from $50 to $75):
1. User opens edit modal (old expense data pre-filled)
2. User submits form with new values
3. revertTransactionImplications(oldExpense) called first
   - Reverses the old expense's balance impact
4. Update expense object with new values
5. applyTransactionImplications(newExpense) called with updated expense
6. saveState() + refreshUI()

// When deleting an expense:
1. User clicks delete on expense row
2. revertTransactionImplications(expense) called
   - Restores cash or reduces card balance (opposite of addition)
3. Expense removed from state.expenses[]
4. saveState() + refreshUI()
```

**Critical Rule:** Every mutation to state MUST follow this pattern:
- Determine old state impact (if editing)
- Apply revert for old state
- Update state object
- Apply new implications
- Save & refresh

Failing to call both `applyTransactionImplications()` and `revertTransactionImplications()` in the correct order will cause balance mismatches.

## Key Conventions

### Naming & Identifiers

- **IDs:** Prefixed by type (`card-`, `rent-pay-`, `exp-`, etc.) to avoid collisions
- **Generated IDs:** Use `Date.now()` for uniqueness in local storage context
- **Element IDs:** Use kebab-case (e.g., `#expense-modal`, `#cc-name`)

### Styling

**Color System:** Defined as CSS variables in `:root`:
- Dark theme background (`--bg-primary`, `--bg-secondary`)
- Accent colors with glow variants (`--primary`, `--primary-glow`)
- Status colors: success (green), danger (red), warning (orange)

**Design System:**
- Fonts: `--font-title: 'Outfit'` (headings), `--font-body: 'Inter'` (body)
- Shadows: `--shadow-sm` (subtle), `--shadow-md` (prominent), `--shadow-lg` (deep)
- Border radius: `--radius-sm` (8px), `--radius-md` (14px), `--radius-lg` (24px)

**Responsive:** Mobile-first with flexbox/grid; sidebar becomes collapsible on small screens.

### HTML Conventions

- Classes use kebab-case (`.tab-view`, `.brand-logo`)
- Data attributes for configuration (`data-tab`, `data-category`, `data-payment`)
- Modal structure: Close button ID = `#close-{feature}-modal`, Cancel button = `#cancel-{feature}-btn`

### JavaScript Conventions

- Render functions follow pattern: `render{Feature}()` (dashboard, expenses, cards, rent)
- All DOM queries cached in event listener setup, not in render loops (performance)
- Event handlers use `.addEventListener()` not inline handlers
- Form validation happens before state mutation
- Always call `saveState()` after modifying state, then `refreshUI()`

## Utility Functions

- `formatCurrency(amount)` — Formats numbers to "$X.XX"
- `escapeHTML(str)` — Prevents XSS in dynamically inserted content
- `getFirstNDays(arr, n)` — Returns first N items (used for dashboard preview)

## External Dependencies

- **Chart.js** (CDN) — Category breakdown pie chart
- **Google Fonts** — Inter (body), Outfit (headings)
- **Browser APIs** — LocalStorage (persistence), DOM API (rendering)

## Local Development

Since this is a static app, no build step is needed:

1. **Open in browser:** Double-click `index.html` or serve via HTTP
   ```powershell
   # Option 1: Quick HTTP server (if Python 3 available)
   python -m http.server 8000

   # Option 2: Open file directly in browser (works locally)
   start index.html
   ```

2. **Test data:** Mock data is bundled in `app.js` state initialization. Modify the `state` object before `loadState()` to test different scenarios.

3. **Debug localStorage:** Open browser DevTools (F12) → Application → LocalStorage → inspect/clear `pocketbooks_state`

## Testing Changes

Since there's no test suite, validation is manual:

- **Add expense** → Verify expense appears in table, category chart updates
- **Edit/Delete expense** → Verify card balance/cash adjusts correctly
- **Add credit card** → Verify appears in Cards tab and in expense payment dropdown
- **Payment from cash vs card** → Verify balance implications are calculated correctly
- **LocalStorage persistence** → Refresh page, verify data persists

## Common Tasks

### Adding a New Expense Category

1. Add category to expense form dropdown in HTML (`index.html`, `#exp-category`)
2. Chart rendering automatically includes all categories in `renderChartData()`
3. No code changes needed in `app.js` — uses category from form input

### Adding a New Dashboard Widget

1. Create new `<div class="widget">` section in `tab-dashboard` in HTML
2. Add corresponding render function in `app.js` (e.g., `renderNewWidget()`)
3. Call from `refreshUI()` to ensure it updates when state changes

### Modifying Colors/Styling

- Change CSS variables in `styles.css` `:root` for global theme updates
- Card-specific colors are hardcoded in HTML (`gradient-blue-purple`, etc.) — update corresponding CSS classes

## Debugging Tips

- **State issues:** `console.log(state)` in browser console to inspect entire state
- **Rendering not updating:** Verify `refreshUI()` is called after state mutation
- **Modal not closing:** Check modal ID matches close button selector
- **LocalStorage full:** Browser has ~5-10MB limit per origin; old entries may need pruning
- **Chart not rendering:** Verify Chart.js CDN is loaded (check Network tab)

### Console Commands for Debugging

```javascript
// Inspect entire state
console.log(state);

// Check localStorage persistence
console.log(JSON.parse(localStorage.getItem('pocketbooks_state')));

// Clear localStorage (will reset all data on next page load)
localStorage.removeItem('pocketbooks_state');

// Monitor state changes (add this at top of file during debugging)
const saveStateOriginal = saveState;
saveState = function() {
  console.log('State saved:', state);
  saveStateOriginal();
};

// Find an expense by ID
const expense = state.expenses.find(e => e.id === 'your-id-here');
console.log(expense);

// Calculate total expenses
const total = state.expenses.reduce((sum, e) => sum + e.amount, 0);
console.log('Total expenses:', formatCurrency(total));

// Check balance of specific card
const card = state.cards.find(c => c.name === 'Chase Sapphire');
console.log(`${card.name} balance: ${formatCurrency(card.balance)} / ${formatCurrency(card.limit)}`);

// Manually trigger refresh (useful after manual state edits)
refreshUI();

// Verify transaction implications (after adding expense)
const lastExpense = state.expenses[state.expenses.length - 1];
console.log('Last expense:', lastExpense);
// Then check if card balance or cash was updated accordingly
```

### Performance Monitoring

Open DevTools → Performance tab:

```javascript
// Log render time for each component
console.time('Dashboard Render');
renderDashboard();
console.timeEnd('Dashboard Render');

// Same for expenses, cards, rent
console.time('All UI Refresh');
refreshUI();
console.timeEnd('All UI Refresh');
```

**Typical baseline (on modern machine):**
- `refreshUI()` should complete in <100ms
- Chart.js render: <50ms
- DOM updates: <20ms
- If exceeding 200ms, profile which render function is slow

## Performance Considerations

### Current Bottlenecks & Optimization Strategies

**DOM Rendering:**
- `refreshUI()` re-renders ALL four sections even if only one changed
  - *Future improvement:* Split into `refreshDashboard()`, `refreshExpenses()`, etc. to only re-render modified sections
  - For now, acceptable since total render time <100ms

**Event Listener Setup:**
- All event listeners are attached in `initNavigation()`, `initModals()`, `initForms()`
- Listeners persist across page loads (no removal needed since page doesn't reload dynamically)
- No memory leaks from listener accumulation

**Chart.js:**
- Chart instance is global (`categoryChart`) and re-instantiated on each `renderDashboard()`
- For 1000+ expenses, consider destroying and recreating only on data change, not every refresh
- Current implementation: acceptable for <5000 expenses

**localStorage Limits:**
```
Typical quota: 5-10MB per origin
PocketBooks typical size: <100KB (even with 1000+ expenses)
Current usage: ~30-50KB with sample data
Headroom: Good for ~5 years of monthly data at current rate
```

**Array Operations:**
- `state.expenses` linear search for edit/delete: O(n) — acceptable for <10,000 items
- Category breakdown in dashboard: O(n) iteration — acceptable
- If scaling to 100,000+ records, switch to indexed Map structure

**CSS Performance:**
- No animations on frequently-updated elements (good)
- Backdrop filter blur used moderately (lightweight GPU effect)
- Flex/Grid layout: performant for current DOM size

**Mobile Considerations:**
- Single-page app loads all CSS/JS upfront (~50 KB total)
- LocalStorage operations are synchronous (fine for this data size)
- No lazy-loading needed currently

## Common Gotchas & Anti-Patterns

### ❌ Gotcha 1: Forgetting to Call `saveState()` After Mutations

**Problem:**
```javascript
// WRONG - State updated but not persisted
state.cash = 100;
refreshUI();  // UI updates, but data lost on page refresh
```

**Solution:**
```javascript
// CORRECT - Always save before refresh
state.cash = 100;
saveState();      // Persist to localStorage
refreshUI();      // Update UI
```

**Impact:** Data loss on page reload. Users lose all changes.

---

### ❌ Gotcha 2: Calling `refreshUI()` Before State is Ready

**Problem:**
```javascript
// WRONG - refreshUI() called before state loaded
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();  // Event listeners attached
  refreshUI();       // Renders with empty state!
  loadState();       // State loaded AFTER render (too late)
});
```

**Solution:**
```javascript
// CORRECT - Load state first, then render
document.addEventListener('DOMContentLoaded', () => {
  loadState();       // Load from localStorage first
  initNavigation();  // Attach event listeners
  initModals();
  initForms();
  refreshUI();       // Now state is ready
});
```

**Impact:** UI renders with mock data or empty state on page load.

---

### ❌ Gotcha 3: Missing Transaction Implications

**Problem:**
```javascript
// WRONG - Added expense to array but forgot implications
const newExpense = {
  id: 'exp-' + Date.now(),
  desc: 'Groceries',
  amount: 50,
  date: today,
  category: 'Food',
  payment: 'Chase Sapphire'
};
state.expenses.push(newExpense);
saveState();
refreshUI();

// Card balance never updated! User thinks they have more balance than they do.
```

**Solution:**
```javascript
// CORRECT - Always apply implications after expense changes
const newExpense = { /* ... */ };
state.expenses.push(newExpense);
applyTransactionImplications(newExpense);  // Update card/cash balance
saveState();
refreshUI();
```

**Impact:** Balance mismatches between expenses and card/cash totals.

---

### ❌ Gotcha 4: Wrong Order of Revert + Apply During Edit

**Problem:**
```javascript
// WRONG - Revert new values instead of old values
const oldExpense = state.expenses.find(e => e.id === editId);
oldExpense.amount = newAmount;  // Update in place
applyTransactionImplications(oldExpense);  // Applied with NEW amount
saveState();
refreshUI();

// Card balance doubled! Applied new implications without reverting old.
```

**Solution:**
```javascript
// CORRECT - Revert old, then apply new
const idx = state.expenses.findIndex(item => item.id === editId);
const oldExpense = state.expenses[idx];

// Revert old implications FIRST
revertTransactionImplications(oldExpense);

// Update the object
state.expenses[idx] = {
  ...oldExpense,
  amount: newAmount,
  date: newDate
};

// Apply NEW implications
applyTransactionImplications(state.expenses[idx]);
saveState();
refreshUI();
```

**Impact:** Balance calculations double-count changes.

---

### ❌ Gotcha 5: Modifying State Without Finding the Reference First

**Problem:**
```javascript
// WRONG - Creating new object, old one still in array
const expense = { id: 'exp-123', desc: 'Old', amount: 50 };
expense.desc = 'New Description';  // Updates local var, not array
// Array still has { id: 'exp-123', desc: 'Old', amount: 50 }
```

**Solution:**
```javascript
// CORRECT - Find the item in the array, then modify
const idx = state.expenses.findIndex(e => e.id === 'exp-123');
state.expenses[idx].desc = 'New Description';  // Updates in array

// OR safer - create new object and replace
state.expenses[idx] = {
  ...state.expenses[idx],
  desc: 'New Description'
};
```

**Impact:** UI doesn't reflect changes; data persisted incorrectly.

---

### ❌ Gotcha 6: Direct DOM Manipulation Instead of State Updates

**Problem:**
```javascript
// WRONG - Changing DOM directly without updating state
document.getElementById('total-cash').textContent = '$100.00';
// On next refreshUI(), gets overwritten with state value
```

**Solution:**
```javascript
// CORRECT - Update state, then let refreshUI() update DOM
state.cash = 100;
saveState();
refreshUI();  // renderDashboard() will update #total-cash from state
```

**Impact:** UI appears to work momentarily but reverts on any state change.

---

### ❌ Gotcha 7: Stale Event Listener References

**Problem:**
```javascript
// WRONG - Event listener created inside a loop/function, loses scope
const cards = state.cards;
cards.forEach(card => {
  const btn = document.getElementById(`pay-${card.id}`);
  btn.addEventListener('click', () => {
    // This reference to 'card' may be stale!
    processPayment(card.id);  // Might be last card in loop
  });
});
```

**Solution:**
```javascript
// CORRECT - Use data attributes, query at event time
document.querySelectorAll('[data-card-id]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const cardId = e.target.closest('[data-card-id]').dataset.cardId;
    processPayment(cardId);  // Always current value
  });
});
```

**Impact:** Click handlers fire with wrong card data.

---

### ❌ Gotcha 8: Missing Input Validation Before State Changes

**Problem:**
```javascript
// WRONG - No validation
const amount = document.getElementById('exp-amount').value;
state.expenses.push({ amount });  // What if amount = ""?
```

**Solution:**
```javascript
// CORRECT - Validate form data
const amount = parseFloat(document.getElementById('exp-amount').value);
if (isNaN(amount) || amount <= 0) {
  alert('Please enter a valid amount');
  return;
}
const desc = document.getElementById('exp-desc').value.trim();
if (!desc) {
  alert('Please enter a description');
  return;
}
state.expenses.push({ desc, amount });
```

**Impact:** Corrupted data in state (NaN, empty strings, negative values).

---

### ❌ Gotcha 9: XSS via Dynamic HTML Insertion

**Problem:**
```javascript
// WRONG - User input rendered directly in HTML
const userInput = expense.desc;  // "Coffee <img src=x onerror='alert(1)'>"
const html = `<span>${userInput}</span>`;
document.getElementById('expense-list').innerHTML = html;  // XSS!
```

**Solution:**
```javascript
// CORRECT - Use escapeHTML() for user content
const userInput = expense.desc;
const safeInput = escapeHTML(userInput);
const html = `<span>${safeInput}</span>`;
document.getElementById('expense-list').innerHTML = html;  // Safe

// OR better - use textContent for plain text
const elem = document.createElement('span');
elem.textContent = userInput;  // textContent never interprets HTML
document.getElementById('expense-list').appendChild(elem);
```

**Impact:** Security vulnerability; malicious user input executes as code.

---

### ❌ Gotcha 10: Assuming Cards Exist in Payment Dropdown

**Problem:**
```javascript
// WRONG - No check if card still exists
const paymentMethod = 'Chase Sapphire';
const card = state.cards.find(c => c.name === paymentMethod);
card.balance += expense.amount;  // ERROR if card was deleted!
```

**Solution:**
```javascript
// CORRECT - Validate card exists
const paymentMethod = 'Chase Sapphire';
const card = state.cards.find(c => c.name === paymentMethod);
if (!card) {
  // Handle edge case: card was deleted since expense was created
  console.warn(`Card "${paymentMethod}" no longer exists`);
  return;  // Don't apply implications
}
card.balance += expense.amount;
```

**Impact:** Runtime errors if a card is deleted; app may crash during refresh.

---

### ✅ Best Practices Checklist

When modifying state, always:

- [ ] **Validate** input data before creating/updating state
- [ ] **Revert old** state implications (if editing)
- [ ] **Update** state object(s)
- [ ] **Apply new** implications
- [ ] **Save** with `saveState()`
- [ ] **Refresh** with `refreshUI()`
- [ ] **Escape** user input with `escapeHTML()` before inserting into HTML
- [ ] **Never** directly manipulate DOM; always update state first
- [ ] **Test** edge cases: card deletion, empty amounts, special characters

## File Size Notes

- `app.js` (~27 KB) contains all business logic and UI rendering
- Consider splitting into modules (expenses, cards, dashboard, etc.) if it exceeds 30-35 KB
- No performance concerns currently, but minification would reduce size by ~30%
