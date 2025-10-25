const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'background': './firefox/background.ts',
    'content-script': './firefox/content-script.ts',
    'popup': './firefox/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist/firefox'),
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
      '@firefox': path.resolve(__dirname, 'firefox')
    }
  },
  optimization: {
    minimize: true
  }
};
