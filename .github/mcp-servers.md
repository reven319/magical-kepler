# MCP Server Configuration - PocketBooks

This file documents the MCP (Model Context Protocol) servers configured for this project and how Copilot agents should use them.

## Configured MCP Servers

### 1. Playwright (Browser Automation)

**Use Case:** Testing UI interactions, validating balance calculations, end-to-end testing

**Common Tasks:**

```python
# Test adding an expense and verifying balance update
await page.goto('file:///path/to/index.html')
await page.fill('#exp-desc', 'Coffee')
await page.fill('#exp-amount', '5.50')
await page.select_option('#exp-payment', 'Cash')
await page.click('#submit-expense-btn')
# Verify cash balance decreased
cash_elem = await page.query_selector('#total-cash')
cash_text = await cash_elem.text_content()
assert '$' in cash_text  # Verify currency format
```

**Test Scenarios to Automate:**
- Add expense from cash → verify cash decreases
- Add expense from credit card → verify card balance increases
- Edit expense (change amount) → verify both old and new balance implications applied
- Delete expense → verify balances revert
- Add credit card → verify appears in dropdown
- Chart updates after adding expenses in different categories

**Setup:**
```bash
npm install -D @playwright/test
# Then use: npx playwright test
```

**Benefits Over Manual Testing:**
- Verify balance calculations work correctly across state changes
- Catch localStorage persistence issues
- Regression test after code changes
- Test modal open/close flow

---

### 2. Filesystem (Enhanced File Operations)

**Use Case:** Project structure analysis, file watching, batch file operations

**Common Tasks:**

```javascript
// List all modified files in past week
mcp:filesystem list-files --path . --recursive --modified-since 2026-07-05

// Get file stats (size, timestamps)
mcp:filesystem get-file-stats --path ./app.js

// Search across files
mcp:filesystem grep --pattern "renderDashboard" --recursive

// Create file backups before major refactoring
mcp:filesystem copy --src ./app.js --dest ./app.js.backup-2026-07-12
```

**When Copilot Should Use:**
- Refactoring large functions in `app.js` — create backup first
- Adding new files/directories (e.g., splitting into modules)
- Finding all usages of a function (e.g., all calls to `refreshUI`)
- Listing files matching a pattern

---

### 3. SQLite (Local Database)

**Use Case:** Migration planning, alternative persistence, analytics/reporting

**Potential Schemas:**

```sql
-- Future migration target schema
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE credit_cards (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  limit REAL NOT NULL,
  balance REAL NOT NULL,
  due_day INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rent_payments (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  month TEXT,
  year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics views (optional)
CREATE VIEW category_spending AS
  SELECT category, SUM(amount) as total
  FROM expenses
  GROUP BY category;

CREATE VIEW monthly_expenses AS
  SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
  FROM expenses
  GROUP BY month;
```

**Current Usage:** localStorage only (no SQLite yet)

**When to Migrate:**
- Data exceeds 5-10MB (unlikely with current usage patterns)
- Need queryable history & analytics
- Want to share data across devices/accounts
- Require backup/export functionality

**Migration Path:**
1. Keep localStorage as primary (current)
2. Optional: Export to SQLite for backup/analytics
3. Future: Consider Electron app with local SQLite database

---

## MCP Server Setup for Copilot Agents

### For Explore/General-Purpose Agents

When delegating work to Copilot sub-agents, include this context:

```markdown
## Available MCP Servers

You have access to:
1. **Playwright** - Browser automation for UI testing
2. **Filesystem** - File operations and project browsing
3. **SQLite** - Local database queries (for analytics/migration planning)

Use these when:
- Testing balance calculations → Playwright
- Refactoring code with backups → Filesystem
- Analyzing spending patterns → SQLite (or write to new DB for analysis)
```

### Common Delegation Patterns

**Pattern 1: Test New Feature**
```
Task: Create a Playwright test for the new budget tracking feature
Available: Playwright MCP
Do: Write test that verifies budget threshold alerts work correctly
```

**Pattern 2: Safe Refactoring**
```
Task: Split app.js into modules (expenses, cards, dashboard, rent)
Available: Filesystem MCP
Do: 
  1. Create backup: copy app.js to app.js.backup
  2. List all functions using filesystem grep
  3. Create new file structure
  4. Update imports in index.html
```

**Pattern 3: Analytics/Reporting**
```
Task: Generate spending report by category
Available: SQLite MCP
Do:
  1. Import localStorage data to SQLite
  2. Query category_spending view
  3. Generate CSV export
```

---

## Maintenance & Monitoring

### Health Checks

```bash
# Verify MCP servers are responding
playwright --version  # Should show latest version

# Check SQLite database if created
sqlite3 pocketbooks.db "SELECT COUNT(*) FROM expenses;"

# Monitor app.js file size
ls -lh app.js  # Alert if exceeding 35KB
```

### When to Expand MCP Usage

- If test coverage drops below 80% → increase Playwright usage
- If app.js exceeds 40KB → use Filesystem to plan modularization
- If data volume exceeds 1000 transactions → plan SQLite migration

---

## Related Documentation

- See `.github/copilot-instructions.md` for architecture and conventions
- See `Performance Considerations` section for optimization notes
