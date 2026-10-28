import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // cacheComponents is intentionally off (ADR 0014): StockPilot's pages are
  // per-user and auth-gated (cookies), so there's little to statically cache and
  // the model's Suspense-everywhere requirement adds friction. Revisit if real
  // static/ISR surfaces appear.
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default withNextIntl(nextConfig);
