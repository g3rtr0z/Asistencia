import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Variables no utilizadas
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],

      // Imports
      'no-duplicate-imports': 'error',
      'no-import-assign': 'error',

      // React
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn',

      // Nomenclatura
      'camelcase': ['error', { properties: 'never' }],

      // Formato
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Permitir console.log en desarrollo
      'no-debugger': 'error',

      // Funciones
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',

      // Objetos
      'object-shorthand': 'error',
      'prefer-object-spread': 'error',

      // Arrays
      'prefer-spread': 'error',

      // Strings
      'prefer-template': 'error',
      'template-curly-spacing': 'error',

      // Condicionales
      'no-unneeded-ternary': 'error',
    },
  },
  {
    files: ['src/components/**/*.{js,jsx}'],
    rules: {
      // Reglas específicas para componentes
      // 'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }], // Requiere eslint-plugin-react
      // 'react/prop-types': 'off', // Usando JSDoc para tipos - Requiere eslint-plugin-react
    },
  },
  {
    files: ['src/hooks/**/*.js'],
    rules: {
      // Reglas específicas para hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
])
