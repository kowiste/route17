import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

// The one ESLint config of Route 17. `pnpm lint` checks, `pnpm lint:fix` fixes.
export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'manual/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettierConfig,
  {
    files: ['**/*.{js,ts,vue}'],
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'prettier/prettier': 'error',
      // TypeScript already reports undefined names, with the right globals per file.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Functions are `function` declarations or methods, never `const` arrows
      // (inline callbacks are fine).
      'func-style': ['error', 'declaration', { allowArrowFunctions: false }],

      // No escape hatches from the type system.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          minimumDescriptionLength: 10,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
          message: 'No `as unknown as`: parse the value with Zod or narrow it with a guard.',
        },
      ],

      // Logging goes through `@/shared/logger`.
      'no-console': 'error',

      // A file over 400 lines is a warning: split it.
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],

      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
      'vue/no-unused-refs': 'error',
      'vue/require-default-prop': 'off',
    },
  },
  {
    files: ['src/shared/logger/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
]
