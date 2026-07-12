# Changelog

All notable changes to PocketBooks will be documented in this file.

## [1.0.0] - 2026-07-12

### Added
- Initial release with core features
- **Expense Tracking** — Log expenses with category, amount, date, and payment method
- **Credit Card Management** — Add multiple cards, track balances and due dates
- **Cash Tracking** — Manage available cash balance with instant updates
- **Rent Tracker** — Log and monitor monthly rent payments with history
- **Dashboard** — Visual spending breakdown by category with interactive pie chart
- **Filtering** — Filter expenses by category and payment method
- **LocalStorage Persistence** — All data auto-saved to browser storage
- **Dark Theme** — Modern, elegant UI with gradient accents
- **Automatic Balance Updates** — Card/cash balances update when expenses change

### Documentation
- `.github/copilot-instructions.md` — Comprehensive development guide for AI assistants
  - Architecture overview with state management patterns
  - Component data flow diagrams
  - Transaction side effects system explanation
  - 10 common gotchas & anti-patterns with solutions
  - Debugging guide with console commands
  - Performance considerations & baselines
  - Best practices checklist
- `.github/mcp-servers.md` — MCP server configuration
  - Playwright for UI testing automation
  - Filesystem operations for safe refactoring
  - SQLite schema for future data migration
- `README.md` — Project overview and quick start guide

## [Unreleased]

### Planned
- Budget limits & spending alerts
- Recurring expenses
- Multiple wallets/profiles
- CSV export/import functionality
- Theme toggle (dark/light)
- Charts by date range & trends
- Multi-device sync (requires backend)
- Spending insights & analytics

---

**Note:** All releases follow semantic versioning (MAJOR.MINOR.PATCH).
