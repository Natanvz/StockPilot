import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import sonarjs from 'eslint-plugin-sonarjs';
import prettier from 'eslint-config-prettier';

// Complexity / clean-code ceilings — ADR 0005 and docs/guides/code-quality.md.
// These are errors, so they fail `npm run lint`, the pre-commit hook, and CI.
const complexityRules = {
  rules: {
    complexity: ['error', 10],
    'max-depth': ['error', 3],
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
    'max-params': ['error', 4],
    'max-nested-callbacks': ['error', 3],
    'sonarjs/cognitive-complexity': ['error', 15],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  sonarjs.configs.recommended,
  complexityRules,
  // Node utility scripts (not app code): allow Node globals.
  {
    files: ['scripts/**/*.{mjs,js,ts}'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly' },
    },
  },
  // e2e specs: sequential flows legitimately repeat strings and run long.
  {
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    rules: {
      'max-lines-per-function': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  // Keep ESLint out of formatting decisions — Prettier owns those.
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'graphify-out/**']),
]);

export default eslintConfig;
