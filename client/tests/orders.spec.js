const { test, expect } = require('@playwright/test');

test.describe('Seller & Buyer Order Acceptance and Wallet Flow', () => {
  test.describe.configure({ mode: 'serial' });

  // Share product name across tests
  let uniqueProductName = `OrderProd_${Date.now()}`;
  let sellerInitialBalance = 0;
  let buyerInitialBalance = 0;
  let shopUrl = '';

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_EXCEPTION:', err.message));
  });

  // 1. Seller creates product and captures initial balance
  test('4.1 Setup - Seller should create product and check initial balance', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/seller/dashboard');

    // Read initial seller balance from Navbar
    const balanceText = await page.locator('span:has-text("Balance:")').textContent();
    sellerInitialBalance = parseFloat(balanceText.replace(/[^0-9.]/g, ''));
    console.log('Seller Initial Balance:', sellerInitialBalance);

    // Create the product with 10 stock
    await page.getByPlaceholder('e.g. Wireless Mouse').fill(uniqueProductName);
    await page.getByPlaceholder('e.g. 19.99').fill('19.99');
    await page.getByPlaceholder('e.g. 10').fill('10');
    await page.getByRole('button', { name: 'Add Product' }).click();

    const successToast = page.locator('div.bg-emerald-50');
    await expect(successToast).toBeVisible();
  });

  // 2. Buyer purchases the product and verifies balance is not yet deducted
  test('4.2 Buyer should checkout and balance should remain pending', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/');

    // Read initial buyer balance
    const balanceText = await page.locator('span:has-text("Balance:")').textContent();
    buyerInitialBalance = parseFloat(balanceText.replace(/[^0-9.]/g, ''));
    console.log('Buyer Initial Balance:', buyerInitialBalance);

    // Clear cart and browse shop dynamically
    await page.evaluate(() => localStorage.removeItem('cart'));
    await page.goto('/');
    const shopCard = page.locator('a').filter({ hasText: 'Computer Shop' }).filter({ hasText: 'Browse Products' });
    await expect(shopCard).toBeVisible();
    await shopCard.click();
    await expect(page).toHaveURL(/\/shop\/[0-9]+/);
    shopUrl = page.url();

    // Find card and click Add to Cart
    const productCard = page.locator('h3', { hasText: uniqueProductName }).locator('..').locator('..');
    await expect(productCard).toBeVisible();
    await productCard.getByRole('button', { name: 'Add to cart' }).click();

    const cartButton = productCard.getByRole('button', { name: /cart/ });
    await expect(cartButton).toHaveText('✓ Added to cart!');

    // Goto cart
    await page.goto('/cart');
    await expect(page.locator(`text=${uniqueProductName}`)).toBeVisible();

    // Dialog handler to auto-accept order success message
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Order placed successfully');
      await dialog.accept();
    });

    // Place Order
    await page.getByRole('button', { name: 'Checkout / Place Order' }).click();
    await expect(page.locator('text=Your cart is empty')).toBeVisible();

    // Verify buyer balance is still initial (NOT deducted yet because order is Pending)
    const pendingBalanceText = await page.locator('span:has-text("Balance:")').textContent();
    const pendingBalance = parseFloat(pendingBalanceText.replace(/[^0-9.]/g, ''));
    expect(pendingBalance).toBeCloseTo(buyerInitialBalance, 2);
  });

  // 3. Seller accepts the order and receives payment
  test('4.3 Seller should accept order and balance should increase', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/seller/dashboard');

    // Go to incoming orders
    await page.goto('/seller/orders');

    // Find the specific order card for our product and click Accept
    const orderCard = page.locator('div.border-zinc-200').filter({ has: page.locator('td', { hasText: uniqueProductName }) });
    await expect(orderCard).toBeVisible();

    const acceptButton = orderCard.getByRole('button', { name: 'Accept Order' });
    await acceptButton.click();

    // Verify success toast
    const successToast = page.locator('div.bg-emerald-50');
    await expect(successToast).toBeVisible();

    // Verify seller balance increased by $19.99
    const finalBalanceText = await page.locator('span:has-text("Balance:")').textContent();
    const finalBalance = parseFloat(finalBalanceText.replace(/[^0-9.]/g, ''));
    expect(finalBalance).toBeCloseTo(sellerInitialBalance + 19.99, 2);
  });

  // 4. Buyer checks balance has been deducted, purchase history, and stock has decremented
  test('4.4 Buyer balance should decrease, order show in profile, and storefront stock show 9', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('http://localhost:3000/');

    // Verify buyer balance decreased by $19.99
    const finalBalanceText = await page.locator('span:has-text("Balance:")').textContent();
    const finalBalance = parseFloat(finalBalanceText.replace(/[^0-9.]/g, ''));
    expect(finalBalance).toBeCloseTo(buyerInitialBalance - 19.99, 2);

    // Go to profile and verify accepted order appears in purchase history
    await page.goto('/profile');
    
    // Purchase History table/card
    const profileHistorySection = page.locator('section').filter({ has: page.locator('h2', { hasText: 'Purchase history' }) });
    await expect(profileHistorySection).toBeVisible();
    
    // The newly accepted order should show status "Accepted" and price 19.99
    const orderRecord = profileHistorySection.locator('div.border-zinc-200').filter({ hasText: 'Accepted' }).filter({ hasText: '$19.99' }).first();
    await expect(orderRecord).toBeVisible();

    // Go to shop and verify stock decremented to 9
    await page.goto(shopUrl);
    const productCard = page.locator('h3', { hasText: uniqueProductName }).locator('..').locator('..');
    await expect(productCard).toContainText('Stock: 9');
  });
});
