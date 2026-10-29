import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * e2e runs against the Firebase emulator (ADR 0009). The webServer builds the app,
 * starts the emulators (`firebase emulators:exec`, which also sets the
 * *_EMULATOR_HOST env vars), seeds the e2e users, then runs a production server —
 * all torn down when Playwright stops it. A production build (not `next dev`) is
 * used so client hydration is reliable under test. Needs Java (Firestore emulator).
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx firebase emulators:exec --project=stockpilot-e2e --only auth,firestore "node scripts/seed-e2e.mjs && npx next start -p ${PORT}"`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: '1',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'stockpilot-e2e',
      FIREBASE_PROJECT_ID: 'stockpilot-e2e',
    },
  },
});
