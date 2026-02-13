const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const ngPlugin = require('@angular-eslint/eslint-plugin');
const ngTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const ngTemplateParser = require('@angular-eslint/template-parser');
const globals = require('globals');
const prettierRules = require('eslint-config-prettier');

module.exports = [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.angular/**', '**/coverage/**', '**/playwright-report/**', '**/test-results/**', 'playwright.config.ts'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { legacyDecorators: true },
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { '@typescript-eslint': tsPlugin, '@angular-eslint': ngPlugin },
    rules: {
      ...ngPlugin.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...prettierRules.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.html'],
    languageOptions: { parser: ngTemplateParser },
    plugins: { '@angular-eslint/template': ngTemplatePlugin },
    rules: { ...ngTemplatePlugin.configs.recommended.rules, ...prettierRules.rules },
  },
  {
    files: ['**/*.spec.ts', '**/*.e2e.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
];