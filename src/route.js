import _ from 'underscore'
import Radio from 'backbone.radio'
import Marionette from 'backbone.marionette'
import RouteContext from './routecontext'
import {getMnRoutes, routerChannel} from './cherrytree-adapter'

export default Marionette.Object.extend(
  {
    constructor (options) {
      this.mergeOptions(options, ['viewClass', 'viewOptions'])
      Marionette.Object.call(this, options);
      this._bindContext()
    },

    activate() {

    },

    deactivate() {

    },

    renderView(region, transition) {
      //todo: move renderView out of Route class??
      if (!this.viewClass) {
        throw new Error('render: viewClass not defined')
      }
      if (this.view && this.updateView(transition)) return ;
      this.view = new this.viewClass(_.result(this, 'viewOptions', {}))
      this.listenToOnce(this.view, 'destroy', function () {
        this.view = void 0
      })
      region.show(this.view)
      routerChannel.trigger('route:render', this)
      if (this.viewEvents) {
        Marionette.bindEvents(this, this.view, this.viewEvents)
      }
    },

    updateView() {

    },

    getContext() {
      //todo: cache context??
      let state = this.$router.state
      let mnRoutes = (state.activeTransition || state).mnRoutes
      if (!mnRoutes) {
        mnRoutes = getMnRoutes(state.routes)
      }
      return new RouteContext(mnRoutes, this)
    },

    _bindContext() {
      let channel, requests = _.result(this, 'contextRequests'),
        events = _.result(this, 'contextEvents')
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
