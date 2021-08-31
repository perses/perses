// Configuration with extra plugins/rules for web/React projects
module.exports = {
  extends: [
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    require.resolve('./.eslintrc.base.js'),
  ],

  env: {
    browser: true,
  },

  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },

  rules: {
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    // Not necessary in React 17
    'react/react-in-jsx-scope': 'off',
  },

  settings: {
    react: {
      version: 'detect',
    },
  },
};
