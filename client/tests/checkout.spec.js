const { test, expect } = require('@playwright/test');

test.describe('Checkout and Stock Reservation Flow', () => {

  test.describe.configure({ mode: 'serial' });

  let uniqueProductName = `CheckoutProd_${Date.now()}`;

  test('3.1 Setup - Seller should create the product', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/seller/dashboard');

    await page.getByPlaceholder('e.g. Wireless Mouse').fill(uniqueProductName);
    await page.getByPlaceholder('e.g. 19.99').fill('19.99');
    await page.getByPlaceholder('e.g. 10').fill('10');

    await page.getByRole('button', { name: 'Add Product' }).click();

    const successToast = page.locator('div.bg-emerald-50');

    await expect(successToast).toBeVisible();
  });

  test('3.2 Buyer should add the product to cart and checkout successfully', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/');

    await page.evaluate(() => localStorage.removeItem('cart'));

    const shopCard = page
      .locator('a')
      .filter({ hasText: 'Computer Shop' })
      .filter({ hasText: 'Browse Products' });

    await expect(shopCard).toBeVisible();
    await shopCard.click();

    await expect(page).toHaveURL(/\/shop\/[0-9]+/);

    const productCard = page
      .locator('h3', { hasText: uniqueProductName })
      .locator('..')
      .locator('..');

    await expect(productCard).toBeVisible();

    await productCard
      .getByRole('button', { name: 'Add to cart' })
      .click();

    const cartButton = productCard.getByRole('button', { name: /cart/ });

    await expect(cartButton).toHaveText('✓ Added to cart!');

    const cartLink = page.getByRole('link', { name: /View cart/ });

    await expect(cartLink).toContainText('View cart (1)');

    await cartLink.click();

    await expect(page).toHaveURL('/cart');

    await expect(
      page.locator(`text=${uniqueProductName}`)
    ).toBeVisible();

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Order placed successfully');
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Checkout / Place Order' }).click();

    await expect(
      page.locator('text=Your cart is empty')
    ).toBeVisible();
  });

});