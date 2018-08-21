const fs = require('fs-extra');
const Git = require('gift');
const gulp = require('gulp');
const log = require('fancy-log');
const path = require('path');
const util = require('util');
const version = require('./package.json').version;

/**
 * when version No is specified, check for be not development status
 */
function checkIsStableVersion () {
    return version.indexOf('dev') === -1;
}

/**
 * move 'dist' directory (that is compiled by the before webpack process) to the distribution directory
 * @param baseDir webroot (/var/www/html/htmlanno) or gh-pages branch root ('.publish')
 * @param tag application root (latest | the version No)
 */
function publish (baseDir, tag) {
    const distDir = path.join(baseDir, tag);
    log.info('replacing ' + distDir);
    fs.removeSync(distDir);
    fs.copySync('dist', distDir);
}

/**
 * clone a repository from GitHub and checkout opts.branch branch.
 * @param opts option set for git
 * @param opts.cacheDir gh-pages branch root ('.publish')
 * @param opts.branch branch name ('gh-pages')
 * @return gift Repo object (https://github.com/notatestuser/gift#repo)
 */
async function cloneAndCheckout (opts) {
    const git = Git(process.cwd());
    const gitConf = await util.promisify(git.config.bind(git))();
    const repository = await util.promisify(Git.clone.bind(this))(gitConf.items['remote.origin.url'], opts.cacheDir);
    await util.promisify(repository.checkout.bind(repository))(opts.branch);

    return repository;
}

gulp.task('prepare', () => {
  fs.removeSync('dist');
  ['index.html', 'index.css', 'jats-preview.css', 'sample'].forEach((target) => {
    fs.copySync(path.join('src', 'preset', target), path.join('dist', target));
  });
});

gulp.task('publish', async () => {
    const readmeFile = 'README.md';
    if (version !== undefined && version !== null) {
        const target = checkIsStableVersion() ? version: 'latest';
        log.info(`start delpoying for ${target}`);
        // Compatible with gulp-gh-pages lib.
        const opts = {
            branch: 'gh-pages',
            message: `updated ${new Date().toISOString()}`,
            cacheDir: '.publish',
            push : true
        };
        log.info(`checking out ${opts.branch} branch as ${opts.cacheDir}`);
        if (fs.existsSync(opts.cacheDir)) {
            fs.removeSync(opts.cacheDir);
        }

        // 1. clone and checkout
        const repo = await cloneAndCheckout(opts);
        // 2, remove current content if exists it
        await util.promisify(repo.remove.bind(repo))(target, {r: true, 'ignore-unmatch': true});
        // 3. local deploy
        publish(opts.cacheDir, target);
        fs.copySync(readmeFile, path.join(opts.cacheDir, readmeFile));
        // 4. add new content to repository
        await util.promisify(repo.add.bind(repo))(target);
        await util.promisify(repo.add.bind(repo))(readmeFile);
        // 5. commit
        const gitStatus = await util.promisify(repo.status.bind(repo))();
        if (gitStatus.clean) {
            log.info('commit are skipped because does not find any difference');
        } else {
            await util.promisify(repo.commit.bind(repo))(opts.message);
            if (opts.push) {
                // 6. push to GitHub (real deploy)
                await util.promisify(repo.remote_push.bind(repo))('origin', opts.branch);
            } else {
                log.info('dry-run');
            }
        }
    } else {
        log.error('Need `version` property in package.json');
    }
});

gulp.task('publishLocal', () => {
    const baseDir = process.env.BASE_DIR;
    publish(baseDir, 'latest');
});
