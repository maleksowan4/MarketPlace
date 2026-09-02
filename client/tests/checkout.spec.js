const { test, expect } = require('@playwright/test');

test.describe('Checkout and Stock Reservation Flow', () => {
  // Force sequential serial execution in the same process
  test.describe.configure({ mode: 'serial' });

  // Share the product name across tests
  let uniqueProductName = `CheckoutProd_${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_EXCEPTION:', err.message));
  });

  // 1. Setup: Seller adds a product to buy
  test('3.1 Setup - Seller should create the product', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/seller/dashboard');

    await page.getByPlaceholder('e.g. Wireless Mouse').fill(uniqueProductName);
    await page.getByPlaceholder('e.g. 19.99').fill('19.99');
    await page.getByPlaceholder('e.g. 10').fill('10'); // Starts with 10 stock
    await page.getByRole('button', { name: 'Add Product' }).click();

    const successToast = page.locator('div.bg-emerald-50');
    await expect(successToast).toBeVisible();
  });

  // 2. Buyer adds the product to cart and checkouts successfully
  test('3.2 Buyer should add the product to cart and checkout successfully', async ({ page }) => {
    // Login as buyer
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Clear cart state from previous runs
    await page.evaluate(() => localStorage.removeItem('cart'));

    // Open Shop
    const shopCard = page.locator('a').filter({ hasText: 'Computer Shop' }).filter({ hasText: 'Browse Products' });
    await expect(shopCard).toBeVisible();
    await shopCard.click();

    await expect(page).toHaveURL(/\/shop\/[0-9]+/);

    // Locate the specific product card using static grandparent navigation of h3
    const productCard = page.locator('h3', { hasText: uniqueProductName }).locator('..').locator('..');
    await expect(productCard).toBeVisible();

    // Click "Add to cart" inside this card
    await productCard.getByRole('button', { name: 'Add to cart' }).click();

    // Verify the button text updates to "✓ Added to cart!"
    const cartButton = productCard.getByRole('button', { name: /cart/ });
    await expect(cartButton).toHaveText('✓ Added to cart!');

    // Verify the Cart icon displays 1 item
    const cartLink = page.getByRole('link', { name: /View cart/ });
    await expect(cartLink).toContainText('View cart (1)');

    // Navigate to Cart page
    await cartLink.click();
    await expect(page).toHaveURL('http://localhost:3000/cart');

    // Verify product exists in cart
    await expect(page.locator(`text=${uniqueProductName}`)).toBeVisible();

    // Setup dialog listener to automatically accept the checkout alert
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Order placed successfully');
      await dialog.accept();
    });

    // Click checkout
    await page.getByRole('button', { name: 'Checkout / Place Order' }).click();

    // Verify cart is now empty
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });
});
