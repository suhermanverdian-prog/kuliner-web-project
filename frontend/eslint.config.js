import storybook from "eslint-plugin-storybook";
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist',
      'node_modules',
      'public',
      'src',
      'tests',
      '.storybook',
      '*.config.js',
      '*.cjs',
      '*.mjs',
      'fix_design.js'
    ]
  },
  {
    files: ['eslint-dummy.js'],
    rules: {
      'no-unused-vars': 'off'
    }
  },
  eslintConfigPrettier
];
