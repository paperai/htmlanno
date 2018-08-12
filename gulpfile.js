const gulp = require('gulp');
const ghPages = require('gulp-gh-pages');
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

gulp.task('deploy', () => {
  if (process.env.NODE_ENV) {
    const target = process.env.NODE_ENV
    // TODO: publish
    const opts = {
      branch: 'test-page',
      message: `updated ${process.env.NODE_ENV}`
    }
    const deployTargets = []

    const srcDir = './docs'
    fs.readdir(srcDir, (err, files) => {
      if (err !== null) {
        console.log(err)
        return
      }
      files.forEach((fileName) => {
        const filePath = srcDir + '/' + fileName
        if (fs.statSync(filePath).isDirectory()) {
          deployTargets.push(filePath + '/**/*')
        }
      })
      console.log(deployTargets)
      gulp.src(deployTargets, {base: './docs/'}).pipe(ghPages(opts))
    })
  } else {
    throw "Usage: NODE_ENV='latest' gulp deploy"
  }
})

