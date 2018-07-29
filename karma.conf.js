module.exports = function (config) {
    config.set({
        browsers: ['ChromeHeadless'],
        files: [
            'spec/**/*Spec.js'
        ],
        frameworks: ['jasmine'],
        preprocessors: {
            'spec/**/*Spec.js': ['webpack']
        },
        reporters: ['spec']
    })
}
