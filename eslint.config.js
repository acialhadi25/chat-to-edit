import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Allow 'any' in test files for mocking purposes
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Allow 'any' in legacy component and page files (to be refactored later)
  {
    files: [
      'src/components/dashboard/ChartPreview.tsx',
      'src/components/dashboard/ChatInterface.tsx',
      'src/components/dashboard/ConditionalFormatPreview.tsx',
      'src/components/dashboard/DataSummaryPreview.tsx',
      'src/components/dashboard/ExcelPreview.tsx',
      'src/components/dashboard/ExcelUpload.tsx',
      'src/components/dashboard/MarkdownContent.tsx',
      'src/components/dashboard/MultiExcelUpload.tsx',
      'src/components/dashboard/TemplateCard.tsx',
      'src/pages/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for legacy files
      'no-case-declarations': 'off',
    },
  }
);
