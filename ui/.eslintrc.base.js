// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Base eslint configuration for typescript projects
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],

  plugins: ['import'],

  env: {
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
    browser: true,
  },

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  settings: {
    react: {
      version: 'detect',
    },
  },

  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/array-type': [
      'warn',
      {
        default: 'array-simple',
      },
    ],
    'import/order': 'warn',
    // you must disable the base rule as it can report incorrect errors
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],

    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    // Not necessary in React 17
    'react/react-in-jsx-scope': 'off',

    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            /**
             * This library is gigantic and named imports end up slowing down builds/blowing out bundle sizes,
             * so this prevents that style of import.
             */
            group: ['mdi-material-ui', '!mdi-material-ui/'],
            message: `
Please use the default import from the icon file directly rather than using a named import.

Good:
import IconName from 'mdi-material-ui/IconName';

Bad:
import { IconName } from 'mdi-material-ui';
`,
          },
        ],
      },
    ],
  },

  ignorePatterns: ['**/dist'],
};
