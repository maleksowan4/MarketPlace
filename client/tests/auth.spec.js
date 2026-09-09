const { test, expect } = require('@playwright/test');

test.describe('Authentication Tests', () => {

  test('1.1 Should login successfully as a Buyer and redirect to home page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/');
  });

  test('1.2 Should login successfully as a Seller and redirect to Seller Dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/seller/dashboard');
  });

  test('1.3 Should login successfully as an Admin and redirect to Admin Dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@market.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('1.4 Should display an error alert when typing incorrect credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('fake_user@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    const errorBox = page.locator('div.bg-red-50');

    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText('Incorrect email or password');
  });

});