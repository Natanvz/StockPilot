import { getRequestConfig } from 'next-intl/server';

/**
 * next-intl "without i18n routing" setup (ADR 0012). Single locale for now;
 * adding a language = add `messages/<locale>.json` and resolve the locale here.
 */
export const locales = ['en'] as const;
export const defaultLocale = 'en';

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
