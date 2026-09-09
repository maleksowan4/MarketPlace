const { test, expect } = require('@playwright/test');

test.describe('Seller & Buyer Order Acceptance and Wallet Flow', () => {
  test.describe.configure({ mode: 'serial' });

  let uniqueProductName = `OrderProd_${Date.now()}`;
  let sellerInitialBalance = 0;
  let buyerInitialBalance = 0;
  let shopUrl = '';

  test('4.1 Setup - Seller should create product and check initial balance', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');

    const walletPromise = page.waitForResponse(
      (resp) => resp.url().includes('/wallet') && resp.status() === 200
    );
    await page.getByRole('button', { name: 'Sign In' }).click();
    await walletPromise;

    await expect(page).toHaveURL('/seller/dashboard');

    const balanceSpan = page.locator('span:has-text("Balance:")');
    await expect(balanceSpan).toBeVisible();
    const balanceText = await balanceSpan.textContent();
    sellerInitialBalance = parseFloat(balanceText.replace(/[^0-9.]/g, '')) || 0;

    console.log('Seller Initial Balance:', sellerInitialBalance);

    await page.getByPlaceholder('e.g. Wireless Mouse').fill(uniqueProductName);
    await page.getByPlaceholder('e.g. 19.99').fill('19.99');
    await page.getByPlaceholder('e.g. 10').fill('10');

    await page.getByRole('button', { name: 'Add Product' }).click();

    const successToast = page.locator('div.bg-emerald-50');

    await expect(successToast).toBeVisible();
  });

  test('4.2 Buyer should checkout and balance should remain pending', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');

    const walletPromise = page.waitForResponse(
      (resp) => resp.url().includes('/wallet') && resp.status() === 200
    );
    await page.getByRole('button', { name: 'Sign In' }).click();
    await walletPromise;

    await expect(page).toHaveURL('/');

    const buyerBalanceSpan = page.locator('span:has-text("Balance:")');
    await expect(buyerBalanceSpan).toBeVisible();
    const buyerBalanceText = await buyerBalanceSpan.textContent();
    buyerInitialBalance = parseFloat(buyerBalanceText.replace(/[^0-9.]/g, '')) || 0;

    console.log('Buyer Initial Balance:', buyerInitialBalance);

    await page.evaluate(() => localStorage.removeItem('cart'));

    await page.goto('/');

    const shopCard = page
      .locator('a')
      .filter({ hasText: 'Computer Shop' })
      .filter({ hasText: 'Browse Products' });

    await expect(shopCard).toBeVisible();

    await shopCard.click();

    await expect(page).toHaveURL(/\/shop\/[0-9]+/);

    shopUrl = page.url();

    const productCard = page
      .locator('h3', { hasText: uniqueProductName })
      .locator('..')
      .locator('..');

    await expect(productCard).toBeVisible();

    await productCard
      .getByRole('button', { name: 'Add to cart' })
      .click();

    const cartButton = productCard.getByRole('button', {
      name: /cart/
    });

    await expect(cartButton).toHaveText('✓ Added to cart!');

    await page.goto('/cart');

    await expect(
      page.locator(`text=${uniqueProductName}`)
    ).toBeVisible();

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Order placed successfully');
      await dialog.accept();
    });

    await page
      .getByRole('button', { name: 'Checkout / Place Order' })
      .click();

    await expect(
      page.locator('text=Your cart is empty')
    ).toBeVisible();

    const pendingBalanceText = await page
      .locator('span:has-text("Balance:")')
      .textContent();

    const pendingBalance = parseFloat(
      pendingBalanceText.replace(/[^0-9.]/g, '')
    );

    expect(pendingBalance).toBeCloseTo(
      buyerInitialBalance,
      2
    );
  });

  test('4.3 Seller should accept order and balance should increase', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('malek.sowan10@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('malek');

    const walletPromise = page.waitForResponse(
      (resp) => resp.url().includes('/wallet') && resp.status() === 200
    );
    await page.getByRole('button', { name: 'Sign In' }).click();
    await walletPromise;

    await expect(page).toHaveURL('/seller/dashboard');

    await page.goto('/seller/orders');

    const orderCard = page
      .locator('div.border-zinc-200')
      .filter({ hasText: uniqueProductName })
      .first();

    await expect(orderCard).toBeVisible();

    const acceptButton = orderCard.getByRole('button', {
      name: 'Accept Order'
    });

    const acceptWalletPromise = page.waitForResponse(
      (resp) => resp.url().includes('/wallet') && resp.status() === 200
    );
    await acceptButton.click();
    await acceptWalletPromise;

    const successToast = page.locator('div.bg-emerald-50');

    await expect(successToast).toBeVisible();

    const finalBalanceText = await page
      .locator('span:has-text("Balance:")')
      .textContent();

    const finalBalance = parseFloat(
      finalBalanceText.replace(/[^0-9.]/g, '')
    );

    expect(finalBalance).toBeCloseTo(
      sellerInitialBalance + 19.99,
      2
    );
  });

  test('4.4 Buyer balance should decrease, order show in profile, and stock show 9', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email Address' }).fill('abadi@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123');

    const walletPromise = page.waitForResponse(
      (resp) => resp.url().includes('/wallet') && resp.status() === 200
    );
    await page.getByRole('button', { name: 'Sign In' }).click();
    await walletPromise;

    await expect(page).toHaveURL('/');

    const finalBalanceSpan = page.locator('span:has-text("Balance:")');
    await expect(finalBalanceSpan).toBeVisible();
    const finalBalanceText = await finalBalanceSpan.textContent();
    const finalBalance = parseFloat(finalBalanceText.replace(/[^0-9.]/g, '')) || 0;

    expect(finalBalance).toBeCloseTo(
      buyerInitialBalance - 19.99,
      2
    );

    await page.goto('/profile');

    const profileHistorySection = page
      .locator('section')
      .filter({
        has: page.locator('h2', {
          hasText: 'Purchase history'
        })
      });

    await expect(profileHistorySection).toBeVisible();

    const orderRecord = profileHistorySection
      .locator('div.border-zinc-200')
      .filter({ hasText: 'Accepted' })
      .filter({ hasText: '$19.99' })
      .first();

    await expect(orderRecord).toBeVisible();

    await page.goto(shopUrl);

    const productCard = page
      .locator('h3', { hasText: uniqueProductName })
      .locator('..')
      .locator('..');

    await expect(productCard).toContainText('Stock: 9');
  });

});