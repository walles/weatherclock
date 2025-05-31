import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

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
      globals: globals.browser,
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
