const { test, expect } = require('@playwright/test');

test.describe('Seller & Buyer Product Flow', () => {
  // Force tests in this file to run sequentially in the same worker process
  test.describe.configure({ mode: 'serial' });

  // This variable is shared between both tests in the serial group
  let uniqueProductName = `Product_${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_EXCEPTION:', err.message));
  });

  test('2.1 Seller should add a new product successfully', async ({ page }) => {
    // 1. Go to Login page
    await page.goto('/login');

    // 2. Login as the seller
    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 3. Verify we are on the dashboard
    await expect(page).toHaveURL('http://localhost:3000/seller/dashboard');

    // 4. Fill in the "Add New Product" form using placeholders
    await page.getByPlaceholder('e.g. Wireless Mouse').fill(uniqueProductName);
    await page.getByPlaceholder('e.g. 19.99').fill('19.99');
    await page.getByPlaceholder('e.g. 10').fill('10');

    // 5. Submit the form
    await page.getByRole('button', { name: 'Add Product' }).click();

    // 6. Assert: Verify the success toast appears
    const successToast = page.locator('div.bg-emerald-50');
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('Product added successfully');

    // 7. Assert: Verify the product is now listed in the "My Products" list
    await expect(page.locator(`text=${uniqueProductName}`)).toBeVisible();
  });

  test('2.2 Buyer should see the new product in the seller shop catalog', async ({ page }) => {
    // 1. Go to Login page
    await page.goto('/login');

    // 2. Login as the buyer
    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 3. Verify we redirect to the buyer homepage
    await expect(page).toHaveURL('http://localhost:3000/');

    // 4. Click on the seller's shop card (named "Computer Shop")
    const shopCard = page.locator('a').filter({ hasText: 'Computer Shop' }).filter({ hasText: 'Browse Products' });
    await expect(shopCard).toBeVisible();
    await shopCard.click();

    // 5. Verify the URL changed to the shop details page (e.g. /shop/1004)
    await expect(page).toHaveURL(/\/shop\/[0-9]+/);

    // 6. Assert: Verify the product we created in Test 2.1 is visible in the list
    await expect(page.locator(`text=${uniqueProductName}`)).toBeVisible();
  });
});
