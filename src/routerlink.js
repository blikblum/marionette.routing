import _ from 'underscore'
import { Behavior } from 'backbone.marionette'
import { routerChannel } from './cherrytree-adapter'
import $ from 'jquery'

function attrChanged (mutations, observer) {
  mutations.forEach(function (mutation) {
    let attr = mutation.attributeName
    if (attr.indexOf('param-') === 0 || attr.indexOf('query-') === 0) {
      updateHref(mutation.target, observer.link)
    }
  })
}

const attrObserverConfig = { attributes: true }

function getAttributeValues (el, prefix, result) {
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

function updateHref (el, link) {
  let routeName = el.getAttribute('route')
  if (!routeName) return
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

function createLinks (routerLink) {
  let rootEl = routerLink.options.rootEl
  let selector = rootEl ? rootEl + ' [route]' : '[route]'
  let $routes = routerLink.view.$(selector)

  $routes.each(function () {
    if (updateHref(this, routerLink)) {
      if (routerLink.attrObserver) routerLink.attrObserver.observe(this, attrObserverConfig)
    }
  })
}

export default Behavior.extend({
  events: {
    'click [route]:not(a)': 'onLinkClick'
  },

  onInitialize (view) {
    this.listenTo(routerChannel, 'transition', this.onTransition)
    if (window.MutationObserver) {
      this.attrObserver = new window.MutationObserver(attrChanged)
      this.attrObserver.link = this
    }
    if (view.isRendered()) createLinks(this)
  },

  onTransition () {
    let self = this
    let rootEl = self.options.rootEl
    let selector = rootEl ? rootEl + ' [route]' : '[route]'
    self.$(selector).each(function () {
      let $el = $(this)
      let routeName = $el.attr('route')
      if (!routeName) return
      let params = getAttributeValues(this, 'param-', self.getDefaults(routeName, 'params', this))
      let query = getAttributeValues(this, 'query-', self.getDefaults(routeName, 'query', this))
      let activeClass = this.hasAttribute('active-class') ? $el.attr('active-class') : 'active'
      if (activeClass) {
        let isActive = routerChannel.request('isActive', routeName, params, query)
        $el.toggleClass(activeClass, isActive)
      }
    })
  },

  onLinkClick (e) {
    let el = e.currentTarget
    if (this.$(el).find('a').length) return
    let routeName = el.getAttribute('route')
    if (!routeName) return
    let params = getAttributeValues(el, 'param-', this.getDefaults(routeName, 'params', el))
    let query = getAttributeValues(el, 'query-', this.getDefaults(routeName, 'query', el))
    routerChannel.request('transitionTo', routeName, params, query)
  },

  onRender () {
    createLinks(this)
  },

  onDestroy () {
    this.stopListening(routerChannel)
  },

  getDefaults (routeName, prop, el) {
    let defaults = this.options.defaults
    if (_.isFunction(defaults)) defaults = defaults.call(this.view)
    let routeDefaults = defaults && defaults[routeName]
    let result = (routeDefaults && routeDefaults[prop])
    if (_.isFunction(result)) result = result.call(this.view, el)
    return _.clone(result) || {}
  },

  attrObserver: undefined
})
