# Contributing to PocketBooks

Thanks for your interest in contributing! This project is small and intended to
be easy to understand. Follow these guidelines to make contributions smooth
and welcome.

## How to contribute

1. Fork the repository and create a branch for your change: `feature/xyz` or `fix/xyz`.
2. Make small, focused changes with clear commit messages.
3. Run the local validation steps (see below).
4. Open a Pull Request describing the change and why it is needed.

## Local validation

This project is a static frontend app. To validate your changes locally:

- Open `index.html` in your browser to test UI changes.
- Run HTML validation via npm (optional):
  - `npx html-validate index.html`
- Manually test core flows:
  - Add, edit, delete expenses
  - Add credit card and verify it appears in dropdowns
  - Make a card payment and verify balances update

## Coding guidelines

- Keep changes small and focused.
- Avoid global side-effects where possible; prefer state mutations through
  the `state` object.
- Sanitize user input with `escapeHTML()` before injecting into DOM.
- When editing transactions, always `revertTransactionImplications()` before
  applying new state.

## Branching and PRs

- Use descriptive branch names: `feature/add-budget`, `fix/formatting`.
- Target `master` branch for PRs. Use small PRs for quick review.

## Reporting security issues

If you find a security vulnerability, please contact the repository owner
privately at reven319@users.noreply.github.com.

## Code of Conduct

By participating you agree to abide by the project's Code of Conduct:
`CODE_OF_CONDUCT.md`
