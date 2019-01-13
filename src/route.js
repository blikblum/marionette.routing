import _ from 'underscore'
import { Events } from 'nextbone'
import { Channel } from 'nextbone-radio'
import { bindEvents } from './utils/bind-events'
import { bindRequests } from './utils/bind-requests'
import { mergeOptions } from './utils/merge-options'
import { Region } from './utils/region'
import RouteContext from './routecontext'
import { getMnRoutes, routerChannel } from './cherrytree-adapter'

const createElement = (route, Definition) => {
  if (typeof Definition === 'function') {
    if (Definition.prototype instanceof HTMLElement) {
      return new Definition()
    }
    return createElement(route, Definition.call(route))
  } else if (typeof Definition === 'string') {
    return document.createElement(Definition)
  }
}

export default class Route extends Events {
  constructor (options, router, config) {
    super()
    mergeOptions.call(this, options, ['component', 'viewOptions'])
    this.$router = router
    this.$config = config
    this._bindContext()
    this.initialize.apply(this, arguments)
  }

  initialize () {

  }

  activate () {

  }

  deactivate () {

  }

  renderView (region, transition) {
    if (this.el && this.updateView(transition)) return
    let ViewClass = this.component
    let viewOptions = _.result(this, 'viewOptions', {})
    let el = createElement(this, ViewClass)
    if (!el) {
      throw new Error(`${this.constructor.name}: component has invalid value ${ViewClass}. Expected a string or HTMLElement`)
    }
    Object.assign(el, viewOptions)
    if (region) {
      region.show(el)
    } else {
      // if region is undefined means no rootRegion is defined
      throw new Error('No root outlet region defined')
    }
    this.el = el
    routerChannel.trigger('route:render', this)
  }

  updateView () {

  }

  getContext () {
    // todo: cache context??
    let state = this.$router.state
    let mnRoutes = (state.activeTransition || state).mnRoutes
    if (!mnRoutes) {
      mnRoutes = getMnRoutes(state.routes)
    }
    return new RouteContext(mnRoutes, this)
  }

  getOutlet () {
    if (!this.outletRegion) {
      const root = this.el.shadowRoot ? this.el.shadowRoot : this.el
      const selector = this.constructor.outletSelector || 'router-outlet'
      const el = root.querySelector(selector)
      if (el) {
        this.outletRegion = new Region(el)
      }
    }
    return this.outletRegion
  }

  _bindContext () {
    const requests = _.result(this, 'contextRequests')
    const events = _.result(this, 'contextEvents')
    let channel
    if (!requests && !events) {
      return
    }

    this._contextChannel = channel = new Channel('__routeContext_' + this.cid)

    bindRequests.call(this, channel, requests)
    bindEvents.call(this, channel, events)
  }

  destroy () {
    this.stopListening()
  }
}
