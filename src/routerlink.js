import _ from 'underscore'
import Marionette from 'backbone.marionette'
import {routerChannel} from './cherrytree-adapter'
import {$} from 'backbone'

function attrChanged(mutations) {
  mutations.forEach(function (mutation) {
    let attr = mutation.attributeName
    if (attr.indexOf('param-') === 0 || attr.indexOf('query-') === 0) {
      updateHref(mutation.target)
    }
  })
}

const attrObserverConfig = {attributes: true}
let attrObserver

function getAttributeValues(el, prefix) {
  let result = {}
  let attributes = el.attributes

  for (let i = 0; i < attributes.length; i++) {
    let attr = attributes[i]
    if (attr.name.indexOf(prefix) === 0) {
      let paramName = attr.name.slice(prefix.length)
      result[paramName] = attr.value
    }
  }
  return result
}

function updateHref(el) {
  let routeName = el.getAttribute('route')
  if (!routeName) return;
  let params = getAttributeValues(el, 'param-')
  let query = getAttributeValues(el, 'query-')
  let href = routerChannel.request('generate', routeName, params, query)
  let anchorEl
  if (el.tagName === 'A') {
    anchorEl = el
  } else {
    anchorEl = $(el).find('a').eq(0)[0]
  }
  if (anchorEl) anchorEl.setAttribute('href', href)
  return anchorEl
}

function createLinks(view) {
  let $routes = view.$('[route]');

  $routes.each(function () {
    if (updateHref(this)) {
      attrObserver &&  (attrObserver = window.MutationObserver ? new MutationObserver(attrChanged) : undefined)
      if (attrObserver) attrObserver.observe(this, attrObserverConfig)
    }
  })
}

export default Marionette.Behavior.extend({
  initialize() {
    let view = this.view
    this.listenTo(routerChannel, 'transition', this.onTransition)
    if (view.el) {
      view.initialize = _.wrap(view.initialize, function (fn) {
        let args = _.rest(arguments, 1)
        fn.apply(view, args)
        if (view.isRendered()) createLinks(view)
      })
    }
  },

  events: {
    'click [route]:not(a)': 'onLinkClick'
  },

  onTransition() {
    let view = this.view
    this.$('[route]').each(function () {
      let $el = view.$(this)
      let routeName = $el.attr('route')
      if (!routeName) return;
      let params = getAttributeValues(this, 'param-')
      let query = getAttributeValues(this, 'query-')
      let isActive = routerChannel.request('isActive', routeName, params, query)
      $el.toggleClass('active', isActive)
    })
  },

  onLinkClick(e) {
    let el = e.currentTarget
    if (this.$(el).find('a').length) return ;
    let routeName = el.getAttribute('route')
    if (!routeName) return;
    let params = getAttributeValues(el, 'param-')
    let query = getAttributeValues(el, 'query-')
    routerChannel.request('transitionTo', routeName, params, query)
  },

  onRender() {
    createLinks(this.view)
  },

  onDestroy() {
    this.stopListening(routerChannel)
  }
})