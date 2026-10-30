import { expect, test } from '@playwright/test';
import { ADMIN, SCREENSHOT_DIR, signIn } from './helpers';

// Full-text search (ADR 0018) is opt-in: it needs Meilisearch running and
// NEXT_PUBLIC_SEARCH_ENABLED=1 in the build. The default e2e run has search off,
// so the test is only *defined* when MEILI_HOST is set (CI sets it with a service
// container; locally: `npm run search`, then run e2e with MEILI_HOST + the flag).
const searchEnabled = Boolean(process.env.MEILI_HOST);

if (searchEnabled) {
  test('an admin can find a product with the search box', async ({ page }) => {
    await signIn(page, ADMIN.email, ADMIN.password);

    // The box only renders when search is enabled; typing filters via Meilisearch.
    const box = page.getByRole('searchbox');
    await expect(box).toBeVisible();
    await box.fill('Zephyr');

    // The seeded "Zephyr Searchable Widget" matches; an unrelated term does not.
    await expect(page.getByRole('cell', { name: 'Zephyr Searchable Widget' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/search-results.png`, fullPage: true });

    await box.fill('nonexistentxyz');
    await expect(page.getByText('No products match your search.')).toBeVisible();
  });
}
