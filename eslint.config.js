import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/**',
      'public/**',
      'resources/**',
      'static/**',
      'themes/**',
      'sanity/**',
      'cloudflare-workers/**',
      '.vercel/**',
      'temp-build/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn'
    }
  },
  prettierConfig
];