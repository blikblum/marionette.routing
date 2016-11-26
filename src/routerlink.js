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

export default Marionette.Behavior.extend({
  initialize() {
    this.listenTo(routerChannel, 'transition', this.onTransition)
  },

  events: {
    'click [route]:not(a)': 'onLinkClick'
  },

  onTransition(transition) {
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
    let routeName = el.getAttribute('route')
    if (!routeName) return;
    let params = getRouteParams(el)
    routerChannel.request('transitionTo', routeName, params)
  },

  onRender() {
    this.$('a[route]').attr({href: function () {
      let routeName = this.getAttribute('route')
      let params = getRouteParams(this)
      return routerChannel.request('generate', routeName, params)
    }})
  },

  onDestroy() {
    this.stopListening(routerChannel)
  }
})