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
    let self = this
    this.$('[route]').each(function () {
      self.$(this).toggleClass('active', this.getAttribute('href') === transition.path)
    })
  },

  onLinkClick(e) {
    let el = e.target
    let routeName = el.getAttribute('route')
    if (!routeName) return;
    let params = getRouteParams(el)
    routerChannel.request('transitionTo', routeName, params)
  },

  onRender() {
    let view = this.view
    this.$('a[route]').attr({href: function () {
      let routeName = this.getAttribute('route')
      let params = getRouteParams(this)
      let value = routerChannel.request('generate', routeName, params)
      return value
    }})
  },

  onDestroy() {
    this.stopListening(routerChannel)
  }
})