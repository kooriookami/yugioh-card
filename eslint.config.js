import { defineConfig } from 'eslint/config';
import pluginVue from 'eslint-plugin-vue';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default defineConfig([
  ...pluginVue.configs['flat/recommended'],
  importPlugin.flatConfigs.recommended,
  {
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // js
      'eol-last': 'error',
      'no-trailing-spaces': 'error',
      'comma-style': ['error', 'last'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-multi-spaces': 'error',
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'object-curly-spacing': ['error', 'always'],
      'arrow-parens': ['error', 'as-needed'],
      'spaced-comment': ['error', 'always'],
      'semi': [2, 'always'],
      'linebreak-style': ['error', 'unix'],
      // vue
      'vue/no-v-html': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': ['error', { singleline: 3, multiline: 1 }],
      'vue/script-indent': ['error', 2, { baseIndent: 0, switchCase: 1 }],
      'vue/order-in-components': 'off',
      'vue/require-default-prop': 'off',
      'vue/html-closing-bracket-spacing': 'error',
      'vue/require-prop-types': 'off',
      'vue/prop-name-casing': 'off',
      'vue/no-template-shadow': 'off',
      'vue/no-side-effects-in-computed-properties': 'off',
      'vue/no-mutating-props': 'off',
      'vue/no-use-v-if-with-v-for': 'off',
      'vue/require-v-for-key': 'off',
      'vue/valid-v-for': 'off',
      'vue/no-unused-vars': 'off',
      'vue/no-v-model-argument': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/no-reserved-component-names': 'off',
      // import
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
        },
      ],
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/named': 'off',
    },
  },
  {
    ignores: [
      'node_modules',
      'docs',
      'public',
    ],
  },
]);
