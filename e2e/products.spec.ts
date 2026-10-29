import { expect, test } from '@playwright/test';
import { ADMIN, SCREENSHOT_DIR, signIn } from './helpers';

test('an admin can create, edit, and delete a product', async ({ page }) => {
  await signIn(page, ADMIN.email, ADMIN.password);
  const name = `E2E Widget ${Date.now()}`;

  // Create (scope fields to the dialog so they don't collide with the toolbar).
  // Category is a select sourced from the categories collection (ADR 0016).
  await page.getByRole('button', { name: 'New product' }).click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByLabel('Name').fill(name);
  await createDialog.getByLabel('Category').selectOption({ label: 'Gadgets' });
  await createDialog.getByLabel('Price (USD)').fill('12.50');
  await createDialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOT_DIR}/product-created.png`, fullPage: true });

  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row.getByText('Gadgets')).toBeVisible();

  // Edit: move the product to a different category
  await row.getByRole('button', { name: 'Edit' }).click();
  const editDialog = page.getByRole('dialog');
  await editDialog.getByLabel('Category').selectOption({ label: 'Gizmos' });
  await editDialog.getByRole('button', { name: 'Save' }).click();
  await expect(row.getByText('Gizmos')).toBeVisible();

  // Delete (confirm in the dialog)
  await row.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('cell', { name, exact: true })).toHaveCount(0);
});
