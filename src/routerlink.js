import _ from 'underscore'
import Marionette from 'backbone.marionette'
import {routerChannel} from './cherrytree-adapter'

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

function createLinks(view) {
  let $routes = view.$('[route]');

  $routes.each(function () {
    let routeName = this.getAttribute('route')
    if (!routeName) return;
    let params = getAttributeValues(this, 'param-')
    let query = getAttributeValues(this, 'query-')
    let href = routerChannel.request('generate', routeName, params, query)
    if (this.tagName === 'A') {
      this.setAttribute('href', href)
    } else {
      view.$(this).find('a').eq(0).attr({href: href})
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