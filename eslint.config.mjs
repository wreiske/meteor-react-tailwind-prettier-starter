import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import pluginImport from 'eslint-plugin-import';
import path from 'node:path';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    // Consolidated ignores (migrated from legacy .eslintignore file)
    ignores: [
      'dist',
      '.meteor',
      'node_modules',
      '**/.meteor/**',
      'apps/web/.meteor/**',
      '**/scheduler.worker.js',
      '_build',
      'build',
      'coverage',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': hooks,
      '@typescript-eslint': ts,
      'jsx-a11y': jsxA11y,
      import: pluginImport,
      'simple-import-sort': simpleImportSort,
      prettier,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          project: [path.resolve('./apps/web/tsconfig.json')],
        },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'prettier/prettier': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
];
