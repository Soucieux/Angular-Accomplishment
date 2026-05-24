import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig(
  { ignores: ['.angular/**', 'node_modules/**', '**/*.spec.ts', 'dist/**', 'functions/lib/**', '*.mjs'] },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname
      }
    }
  },

  {
    rules: {
      '@typescript-eslint/no-deprecated': 'warn'
    }
  }
)