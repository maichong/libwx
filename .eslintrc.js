module.exports = {
  extends: [
    'eslint-config-alloy/typescript',
  ],
  globals: {},
  settings: {
  },
  rules: {
    complexity: 'off',
    'guard-for-in': 'off',
    indent: ['error', 2, {
      SwitchCase: 1
    }],
    'max-nested-callbacks': ['error', 4],
    'no-useless-constructor': 'off',
    'no-param-reassign': 'off',
    "no-return-await": 'off',
    'no-unused-vars': 'off',
    'prefer-template': 'error',
    radix: 'off'
  }
}
