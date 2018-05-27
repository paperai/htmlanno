module.exports = {
  entry: "./src/main.js",
  output: {
    filename: "./dist/bundle.js"
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",
  externals: {
    "jquery": "jQuery"
  },
  devServer: {
    // [webpack-dev-server's BUG] cannot use '0.0.0.0', use '<real server IP address>' or update to webpack-dev-server v2.4.3
    // see https://github.com/webpack/webpack-dev-server/issues/882
    host: 'localhost', 
    port: 8080
  }
};
