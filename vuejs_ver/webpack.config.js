module.exports = {
  entry: "./src/main.js",
  output: {
    filename: "./bundle.js"
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",
  externals: {
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    }
  },
};
