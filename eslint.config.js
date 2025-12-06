const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const functional = require('eslint-plugin-functional');
const prettier = require('eslint-plugin-prettier');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  // Ignore patterns
  {
    ignores: ['node_modules', 'dist'],
  },

  // Base ESLint recommended config
  eslint.configs.recommended,

  // TypeScript configs
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Main configuration
  {
    files: ['**/*.ts', '**/*.tsx'],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      functional: functional,
      prettier: prettier,
    },

    rules: {
      'prettier/prettier': 'error',
      'functional/prefer-readonly-type': 'off',
      'functional/no-conditional-statement': 'off',
      'functional/no-try-statement': 'off',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      'functional/no-let': 'off',
      'functional/no-loop-statement': 'off',
      'functional/functional-parameters': 'off',
      'functional/no-expression-statement': 'off',
      'functional/no-return-void': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'no-param-reassign': 'off',
      'functional/immutable-data': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'functional/no-mixed-type': 'off',
      'functional/no-class': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'functional/no-throw-statement': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
    },
  },

  // Prettier config (should be last to override formatting rules)
  eslintConfigPrettier,
];
