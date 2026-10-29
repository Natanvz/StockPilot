import { expect, type Page } from '@playwright/test';

export const SCREENSHOT_DIR = 'e2e/screenshots';

export const ADMIN = { email: 'admin@e2e.test', password: 'password123' };
export const VIEWER = { email: 'viewer@e2e.test', password: 'password123' };

/**
 * Sign in through the UI and wait for the dashboard. Retries the whole
 * navigate → fill → submit so the first click can't race client hydration
 * (dev-mode compiles a page on first hit).
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await expect(async () => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  }).toPass({ timeout: 45000 });
}
