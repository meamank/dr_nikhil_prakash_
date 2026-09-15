import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/routeTree.gen.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Route modules and shared UI modules intentionally export route/config
    // helpers alongside components. They are valid Fast Refresh boundaries.
    files: [
      'src/routes/**/*.{ts,tsx}',
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/patients-table.tsx',
      'src/features/patients/components/patients-table.tsx',
      'src/features/appointments/appointments-header-context.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
