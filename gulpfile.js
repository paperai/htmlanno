const gulp = require('gulp');
const fs = require('fs-extra');
const path = require('path');
const version = require('./package.json').version;

gulp.task('prepare', () => {
  fs.removeSync('dist');
  ['index.html', 'index.css', 'jats-preview.css', 'sample'].forEach((target) => {
    fs.copySync(path.join('src', 'preset', target), path.join('dist', target));
  });
});
