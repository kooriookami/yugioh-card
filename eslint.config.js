import { defineConfig, globalIgnores } from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default defineConfig([
  ...pluginVue.configs['flat/recommended'],
  {
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@stylistic/eol-last': 'error',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/comma-style': ['error', 'last'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/no-multi-spaces': ['error', { exceptions: { Property: true } }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/spaced-comment': ['error', 'always'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/linebreak-style': ['error', 'unix'],
      'vue/prefer-import-from-vue': 'off',
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': ['error', { singleline: 3, multiline: 1 }],
      'vue/script-indent': ['error', 2, { baseIndent: 0, switchCase: 1 }],
      'vue/require-default-prop': 'off',
      'vue/html-closing-bracket-spacing': 'error',
    },
  },
  globalIgnores([
    'dist/',
    'docs/.vitepress/cache/',
    'docs/.vitepress/dist/',
    'public/',
  ]),
]);
