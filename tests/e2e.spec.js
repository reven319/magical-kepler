const { test, expect } = require('@playwright/test');

const today = new Date().toISOString().split('T')[0];

test.beforeEach(async ({ page }) => {
  const base = process.env.BASE_URL || 'http://localhost:8080';
  await page.goto(base);
});

test('add expense via modal updates recent transactions and cash', async ({ page }) => {
  // Capture initial cash
  const cashBeforeText = await page.textContent('#total-cash');
  const cashBefore = Number(cashBeforeText.replace(/[^0-9.-]+/g, ''));

  await page.click('#quick-add-expense-btn');
  await page.fill('#exp-desc', 'Playwright Test Coffee');
  await page.fill('#exp-amount', '3.50');
  await page.fill('#exp-date', today);
  await page.selectOption('#exp-category', 'Food');
  await page.selectOption('#exp-payment', 'Cash');
  await page.click('#expense-form button[type="submit"]');

  // Recent transactions should contain the new expense
  await expect(page.locator('#recent-transactions-list')).toContainText('Playwright Test Coffee');

  // Cash should decrease by ~3.50
  const cashAfterText = await page.textContent('#total-cash');
  const cashAfter = Number(cashAfterText.replace(/[^0-9.-]+/g, ''));
  expect(cashAfter).toBeCloseTo(cashBefore - 3.5, 2);
});

test('add credit card and use as payment', async ({ page }) => {
  await page.click('.nav-item[data-tab="cards"]');
  await page.click('#add-credit-card-btn');
  await page.fill('#cc-name', 'Playwright Card');
  await page.fill('#cc-limit', '5000');
  await page.fill('#cc-balance', '0');
  await page.fill('#cc-due-day', '15');
  await page.selectOption('#cc-color', 'gradient-blue-purple');
  await page.click('#cc-form button[type="submit"]');

  // Go back to expenses and create expense paid with card
  await page.click('.nav-item[data-tab="expenses"]');
  await page.click('#quick-add-expense-btn');
  await page.fill('#exp-desc', 'Playwright Card Purchase');
  await page.fill('#exp-amount', '10.00');
  await page.fill('#exp-date', today);
  await page.selectOption('#exp-category', 'Other');
  await page.selectOption('#exp-payment', 'Playwright Card');
  await page.click('#expense-form button[type="submit"]');

  // Card balance should increase
  await page.click('.nav-item[data-tab="cards"]');
  await expect(page.locator('#credit-cards-grid')).toContainText('Playwright Card');
  await expect(page.locator('#credit-cards-grid')).toContainText('$10.00');
});
