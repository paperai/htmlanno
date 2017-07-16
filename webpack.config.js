module.exports = {
  entry: "./src/main.js",
  output: {
    filename: "./docs/bundle.js"
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",
  externals: {
    "jquery": "jQuery"
  },
};
