const gulp = require('gulp');
const fs = require('fs-extra');
const path = require('path');
const version = require('./package.json').version;

let baseDir;

function checkIsStableVersion () {
    if (version.indexOf('dev') !== -1) {
        throw 'version is not stable. version=' + version
    }
}

function publish () {
  fs.removeSync(baseDir);
  fs.copySync('dist', baseDir);
}

gulp.task('prepare', () => {
  fs.removeSync('dist');
  ['index.html', 'index.css', 'jats-preview.css', 'sample'].forEach((target) => {
    fs.copySync(path.join('src', 'preset', target), path.join('dist', target));
  });
});

gulp.task('publish_latest', () => {
  baseDir = path.join('docs', 'latest');
  publish();
});

gulp.task('publish_stable', () => {
  checkIsStableVersion();
  baseDir = path.join('docs', version);
  publish();
});
