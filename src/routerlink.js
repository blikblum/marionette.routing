import _ from 'underscore'
import Marionette from 'backbone.marionette'
import {routerChannel} from './cherrytree-adapter'
import {$} from 'backbone'

function attrChanged(mutations, observer) {
  mutations.forEach(function (mutation) {
    let attr = mutation.attributeName
    if (attr.indexOf('param-') === 0 || attr.indexOf('query-') === 0) {
      updateHref(mutation.target, observer.link)
    }
  })
}

const attrObserverConfig = {attributes: true}

function getAttributeValues(el, prefix, result) {
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

function updateHref(el, link) {
  let routeName = el.getAttribute('route')
  if (!routeName) return;
  let params = getAttributeValues(el, 'param-', link.getDefaults(routeName, 'params', el))
  let query = getAttributeValues(el, 'query-', link.getDefaults(routeName, 'query', el))
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

function createLinks(routerLink) {
  let $routes = routerLink.view.$('[route]');

  $routes.each(function () {
    if (updateHref(this, routerLink)) {
      if (routerLink.attrObserver) routerLink.attrObserver.observe(this, attrObserverConfig)
    }
  })
}

export default Marionette.Behavior.extend({
  initialize() {
    let view = this.view
    let self = this
    this.listenTo(routerChannel, 'transition', this.onTransition)
    if (view.el) {
      view.initialize = _.wrap(view.initialize, function (fn) {
        let args = _.rest(arguments, 1)
        fn.apply(view, args)
        if (view.isRendered()) createLinks(self)
      })
    }
    if (window.MutationObserver) {
      this.attrObserver = new window.MutationObserver(attrChanged)
      this.attrObserver.link = this
    }
  },

  events: {
    'click [route]:not(a)': 'onLinkClick'
  },

  onTransition() {
    let self = this
    let view = this.view
    this.$('[route]').each(function () {
      let $el = view.$(this)
      let routeName = $el.attr('route')
      if (!routeName) return;
      let params = getAttributeValues(this, 'param-', self.getDefaults(routeName, 'params', this))
      let query = getAttributeValues(this, 'query-', self.getDefaults(routeName, 'query', this))
      let isActive = routerChannel.request('isActive', routeName, params, query)
      $el.toggleClass('active', isActive)
    })
  },

  onLinkClick(e) {
    let el = e.currentTarget
    if (this.$(el).find('a').length) return ;
    let routeName = el.getAttribute('route')
    if (!routeName) return;
    let params = getAttributeValues(el, 'param-', this.getDefaults(routeName, 'params', el))
    let query = getAttributeValues(el, 'query-', this.getDefaults(routeName, 'query', el))
    routerChannel.request('transitionTo', routeName, params, query)
  },

  onRender() {
    createLinks(this)
  },

  onDestroy() {
    this.stopListening(routerChannel)
  },
  
  getDefaults(routeName, prop, el) {
    let defaults = this.options.defaults && this.options.defaults[routeName]
    defaults = (defaults && defaults[prop])
    if (_.isFunction(defaults)) defaults = defaults.call(this.view, el)
    return _.clone(defaults) || {}
  },

  attrObserver: undefined
})