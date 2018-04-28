module.exports = {
  entry: "./src/main.js",
  output: {
    filename: "./dist/bundle.js"
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",
  externals: {
  //  "jquery": "jQuery"
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    }
  },
};
