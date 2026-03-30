import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['out/**', 'node_modules/**'] },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  prettierConfig
)
