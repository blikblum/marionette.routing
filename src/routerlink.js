import _ from 'underscore'
import Marionette from 'backbone.marionette'
import {routerChannel} from './cherrytree-adapter'

function getRouteParams(el) {
  let result = {}
  let attributes = el.attributes

  for (let i = 0; i < attributes.length; i++) {
    let attr = attributes[i]
    if (attr.name.indexOf('param-') === 0) {
      let paramName = attr.name.slice('param-'.length)
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
    let params = getRouteParams(this)
    let href = routerChannel.request('generate', routeName, params)
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
    view.initialize = _.wrap(view.initialize, function (fn) {
      let args = _.rest(arguments, 1)
      fn.apply(view, args)
      if (view.isRendered()) createLinks(view)
    })
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
      let isActive = routerChannel.request('isActive', routeName, getRouteParams(this))
      $el.toggleClass('active', isActive)
    })
  },

  onLinkClick(e) {
    let el = e.currentTarget
    if (this.$(el).find('a').length) return ;
    let routeName = el.getAttribute('route')
    if (!routeName) return;
    let params = getRouteParams(el)
    routerChannel.request('transitionTo', routeName, params)
  },

  onRender() {
    createLinks(this.view)
  },

  onDestroy() {
    this.stopListening(routerChannel)
  }
})