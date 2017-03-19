import _ from 'underscore'
import Backbone from 'backbone'

global._ = _
global.Backbone = Backbone

let jsdom;

before(function () {
  jsdom = require('jsdom-global')()
  Backbone.$ = global.$ = require('jquery')(window)
});

after(function () {
  jsdom()
})
