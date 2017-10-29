module.exports = {
  entry: "./test/index.js",
  output: {
    filename: "./test/bundle_test.js"
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",
  externals: {
    "jquery": "jQuery"
  },
};
