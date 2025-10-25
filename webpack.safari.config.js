const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'background': './safari/Browser-Context-Plugin.safariextension/background.js',
    'content-script': './safari/Browser-Context-Plugin.safariextension/content-script.js',
    'popup': './safari/Browser-Context-Plugin.safariextension/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist/safari'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@safari': path.resolve(__dirname, 'safari')
    }
  },
  optimization: {
    minimize: true
  }
};
