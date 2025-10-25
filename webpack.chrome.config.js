const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'background': './chrome/background.ts',
    'content-script': './chrome/content-script.ts',
    'popup': './chrome/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist/chrome'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@chrome': path.resolve(__dirname, 'chrome')
    }
  },
  optimization: {
    minimize: true
  }
};
