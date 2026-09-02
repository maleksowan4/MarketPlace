const { test, expect } = require('@playwright/test');

test.describe('Buyer Complaint and Admin Resolution Flow', () => {
  test.describe.configure({ mode: 'serial' });

  let uniqueProductName = `ComplaintProd_${Date.now()}`;
  let complaintComment = `Counterfeit items and no shipping dispute ${Date.now()}`;
  let shopUrl = '';

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_EXCEPTION:', err.message));
  });

  // 1. Seller adds product (Setup)
  test('5.1 Setup - Seller should create the product', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/seller/dashboard');

    await page.getByPlaceholder('e.g. Wireless Mouse').fill(uniqueProductName);
    await page.getByPlaceholder('e.g. 19.99').fill('19.99');
    await page.getByPlaceholder('e.g. 10').fill('10');
    await page.getByRole('button', { name: 'Add Product' }).click();

    const successToast = page.locator('div.bg-emerald-50');
    await expect(successToast).toBeVisible();
  });

  // 2. Buyer files a complaint
  test('5.2 Buyer should file a complaint against Computer Shop', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/');

    // Navigate to shop dynamically
    await page.evaluate(() => localStorage.removeItem('cart'));
    const shopCard = page.locator('a').filter({ hasText: 'Computer Shop' }).filter({ hasText: 'Browse Products' });
    await expect(shopCard).toBeVisible();
    await shopCard.click();
    await expect(page).toHaveURL(/\/shop\/[0-9]+/);
    shopUrl = page.url();

    // Click Report Shop button
    const reportButton = page.getByRole('button', { name: /Report Shop/ });
    await expect(reportButton).toBeVisible();
    await reportButton.click();

    // Fill complaint form in Modal
    const modal = page.locator('div').filter({ has: page.locator('h3', { hasText: 'Report Shop' }) }).last();
    await expect(modal).toBeVisible();

    const textarea = modal.locator('textarea');
    await textarea.fill(complaintComment);

    // Dialog handler to auto-accept submission success alert
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Report submitted successfully');
      await dialog.accept();
    });

    // Click Submit
    await modal.getByRole('button', { name: 'Submit' }).click();
    await expect(modal).not.toBeVisible();
  });

  // 3. Admin logs in and blocks the shop
  test('5.3 Admin should login and block the shop', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Login as Admin using static credentials
    await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@market.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/admin/dashboard');

    // Find the complaint card/row with our unique comment
    const complaintRow = page.locator('tr').filter({ has: page.locator('td', { hasText: complaintComment }) }).first();
    await expect(complaintRow).toBeVisible();

    // Block the Shop
    const blockButton = complaintRow.getByRole('button', { name: 'Block Shop' });
    await blockButton.click();

    // Verify success toast
    const successToast = page.locator('div').filter({ hasText: 'Shop block status updated successfully!' }).first();
    await expect(successToast).toBeVisible();
  });

  // 4. Buyer logs in and verifies the shop is blocked (disappeared from homepage)
  test('5.4 Buyer should not see the blocked shop on the homepage', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/');

    // Verify that Computer Shop card is NOT visible anymore
    const shopCard = page.locator('a').filter({ hasText: 'Computer Shop' }).filter({ hasText: 'Browse Products' });
    await expect(shopCard).not.toBeVisible();
  });

  // 5. Clean up - Admin logs in and unblocks the shop
  test('5.5 Cleanup - Admin should unblock the shop', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@market.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/admin/dashboard');

    // Find the complaint row again
    const complaintRow = page.locator('tr').filter({ has: page.locator('td', { hasText: complaintComment }) }).first();
    await expect(complaintRow).toBeVisible();

    // Click Unblock Shop
    const unblockButton = complaintRow.getByRole('button', { name: 'Unblock Shop' });
    await unblockButton.click();

    // Verify success toast
    const successToast = page.locator('div').filter({ hasText: 'Shop block status updated successfully!' }).first();
    await expect(successToast).toBeVisible();
  });
});
