/* global before,after */
const _ = require('underscore')
const Backbone = require('backbone')

require('babel-core/register')({
  // This will override `node_modules` ignoring
  ignore: function (filepath) {
    return filepath.indexOf('node_modules') !== -1 && filepath.indexOf('cherrytree') === -1
  }
})

global._ = _
global.Backbone = Backbone

let jsdom

before(function () {
  jsdom = require('jsdom-global')()
  Backbone.$ = global.$ = require('jquery')(window)
})

after(function () {
  jsdom()
})
