import { expect, test } from '@playwright/test';
import { ADMIN, SCREENSHOT_DIR, VIEWER, signIn } from './helpers';

test('signed-out access to the dashboard redirects to sign-in', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('an admin sees product-management controls', async ({ page }) => {
  await signIn(page, ADMIN.email, ADMIN.password);
  await expect(page.getByRole('button', { name: 'New product' })).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOT_DIR}/admin-dashboard.png`, fullPage: true });
});

test('a viewer is read-only and is blocked from writing on the server', async ({ page }) => {
  await signIn(page, VIEWER.email, VIEWER.password);

  // No write controls in the UI...
  await expect(page.getByRole('button', { name: 'New product' })).toHaveCount(0);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/viewer-dashboard.png`, fullPage: true });

  // ...and the server rejects a write even with the viewer's own session cookie.
  const response = await page.request.post('/api/products', {
    data: { name: 'Blocked', categoryId: 'cat-gadgets', price: 100, status: 'active' },
  });
  expect(response.status()).toBe(403);
});
