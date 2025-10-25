const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'background': './edge/background.ts',
    'content-script': './edge/content-script.ts',
    'popup': './edge/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist/edge'),
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
      '@edge': path.resolve(__dirname, 'edge')
    }
  },
  optimization: {
    minimize: true
  }
};
