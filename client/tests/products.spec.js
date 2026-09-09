const { test, expect } = require('@playwright/test');

test.describe('Seller & Buyer Product Flow', () => {
  test.describe.configure({ mode: 'serial' });

  let uniqueProductName = `Product_${Date.now()}`;

  test('2.1 Seller should add a new product successfully', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/seller/dashboard');

    const nameInput = page.getByPlaceholder('e.g. Wireless Mouse');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(uniqueProductName);
    await page.getByPlaceholder('e.g. 19.99').fill('19.99');
    await page.getByPlaceholder('e.g. 10').fill('10');

    await page.getByRole('button', { name: 'Add Product' }).click();

    const successToast = page.locator('div.bg-emerald-50');

    await expect(successToast).toBeVisible();

    await expect(successToast).toContainText(
      'Product added successfully'
    );

    await expect(
      page.locator(`text=${uniqueProductName}`)
    ).toBeVisible();
  });

  test('2.2 Buyer should see the new product in the seller shop catalog', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/');

    const shopCard = page
      .locator('a')
      .filter({ hasText: 'Computer Shop' })
      .filter({ hasText: 'Browse Products' });

    await expect(shopCard).toBeVisible();

    await shopCard.click();

    await expect(page).toHaveURL(/\/shop\/[0-9]+/);

    await expect(
      page.locator(`text=${uniqueProductName}`)
    ).toBeVisible();
  });
});