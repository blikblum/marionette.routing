import _ from 'underscore'
import Radio from 'backbone.radio'
import { Object as MnObject, bindEvents, View } from 'backbone.marionette'
import RouteContext from './routecontext'
import {getMnRoutes, routerChannel} from './cherrytree-adapter'

export default MnObject.extend(
  {
    constructor (options, config) {
      this.mergeOptions(options, ['viewClass', 'viewOptions'])
      this.$config = config
      MnObject.call(this, options)
      this._bindContext()
    },

    cidPrefix: 'rou',

    activate () {

    },

    deactivate () {

    },

    renderView (region, transition) {
      if (this.view && this.updateView(transition)) return
      let ViewClass = this.viewClass || View
      let viewOptions = _.result(this, 'viewOptions', {})
      if (!(ViewClass.prototype instanceof View)) {
        if (_.isFunction(ViewClass)) {
          ViewClass = ViewClass.call(this)
        }
        if (!(ViewClass.prototype instanceof View)) {
          viewOptions = _.extend({}, ViewClass, viewOptions)
          ViewClass = View
        }
      }
      let view = new ViewClass(viewOptions)
      this.listenToOnce(view, 'destroy', function () {
        this.view = void 0
      })
      if (region) {
        region.show(view)
      } else {
        // if region is undefined means no rootRegion is defined
        // accept a pre-rendered view in those situations throwing otherwise
        if (!view.isRendered()) throw new Error('No root outlet region defined')
      }
      this.view = view
      routerChannel.trigger('route:render', this)
      if (this.viewEvents) {
        bindEvents(this, view, this.viewEvents)
      }
    },

    updateView () {

    },

    getContext () {
      // todo: cache context??
      let state = this.$router.state
      let mnRoutes = (state.activeTransition || state).mnRoutes
      if (!mnRoutes) {
        mnRoutes = getMnRoutes(state.routes)
      }
      return new RouteContext(mnRoutes, this)
    },

    getOutlet () {
      return this.view.getRegion('outlet')
    },

    _bindContext () {
      const requests = _.result(this, 'contextRequests')
      const events = _.result(this, 'contextEvents')
      let channel
      if (!requests && !events) {
        return
      }

      this._contextChannel = channel = new Radio.Channel('__routeContext_' + this.cid)

      this.bindRequests(channel, requests)
      this.bindEvents(channel, events)
    },

    $router: null
  }
)
