import { expect, type Page } from '@playwright/test';

export const SCREENSHOT_DIR = 'e2e/screenshots';

export const ADMIN = { email: 'admin@e2e.test', password: 'password123' };
export const VIEWER = { email: 'viewer@e2e.test', password: 'password123' };

/** Sign in through the UI and wait for the dashboard. */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
