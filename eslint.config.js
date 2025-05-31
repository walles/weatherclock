import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';

// Browser globals for flat config (copied from ESLint's browser set)
const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  console: 'readonly',
  alert: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  // Add more as needed
};

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}', '*.js', '*.ts', '*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: browserGlobals,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // TypeScript
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      // Your custom rules
      'consistent-return': 2,
      'no-var': 1,
      curly: 1,
      'no-console': 0,
      'no-continue': 0,
      '@typescript-eslint/naming-convention': 0,
      'react/destructuring-assignment': 0,
      'no-underscore-dangle': 0,
      'max-classes-per-file': 0,
      'react/require-default-props': 0,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: ['src/react-app-env.d.ts'],
  },
];
