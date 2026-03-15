module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@vue/prettier'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-components': 'warn',
    'vue/require-default-prop': 'off',
    'vue/require-explicit-emits': 'off',
    'prettier/prettier': 'error'
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.spec.*'],
      env: {
        jest: true
      }
    }
  ]
}