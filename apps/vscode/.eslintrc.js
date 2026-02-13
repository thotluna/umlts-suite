const path = require('path')

module.exports = {
  extends: '../../.eslintrc.json',
  parserOptions: {
    project: [
      path.resolve(__dirname, 'tsconfig.json'),
      path.resolve(__dirname, 'server/tsconfig.json'),
    ],
    tsconfigRootDir: __dirname,
  },
}
