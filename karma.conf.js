// Karma configuration
// Generated on Sat Nov 10 2018 16:28:45 GMT-0200 (Horário brasileiro de verão)

const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')
const babel = require('rollup-plugin-babel')

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'sinon-chai'],

    plugins: ['karma-mocha', 'karma-sinon-chai', 'karma-rollup-preprocessor', 'karma-chrome-launcher'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/underscore/underscore.js',
      'test/index.js'
    ],

    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/index.js': ['rollup']
    },

    rollupPreprocessor: {
      plugins: [babel({
        exclude: ['node_modules/**', 'test/**']
      }), commonjs(), nodeResolve({
        only: [/^(?!.*?underscore).*/]
      })],

      output: {
        format: 'iife', // Helps prevent naming collisions.
        name: 'routingTests', // Required for 'iife' format.
        sourcemap: 'inline' // Sensible for testing.
      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    client: {
      mocha: {
        // change Karma's debug.html to the mocha web reporter
        // reporter: 'html'
      }
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'],

    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: ['--remote-debugging-port=9333']
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
