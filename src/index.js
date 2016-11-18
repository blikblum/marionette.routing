/**
 * Marionette Routing
 *
 * Copyright © 2015-2016 Luiz Américo Pereira Câmara. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import _ from 'underscore'
import Radio from 'backbone.radio'
import Marionette from 'backbone.marionette'
import cherrytree from 'cherrytree'

let mnRouteMap = Object.create(null)
let routerChannel = Radio.channel('router')
let router

class RouteContext {
  constructor(routes, route) {
    let routeIndex = routes.indexOf(route)
    this.parentRoutes = routes.slice(0, routeIndex)
  }

  trigger() {
    let parentRoutes = this.parentRoutes
    for (let i = parentRoutes.length - 1; i >= 0; i--) {
      let channel = parentRoutes[i]._contextChannel
      if (channel) {
        channel.trigger.apply(channel, arguments)
      }
    }
  }

  request(name) {
    let parentRoutes = this.parentRoutes
    for (let i = parentRoutes.length - 1; i >= 0; i--) {
      let channel = parentRoutes[i]._contextChannel
      if (channel && channel._requests[name]) {
        return channel.request.apply(channel, arguments)
      }
    }
  }
}

export const Route = Marionette.Object.extend(
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

    renderView(region) {
      //todo: move renderView out of Route class??
      if (!this.viewClass) {
        throw new Error('render: viewClass not defined')
      }
      this.view = new this.viewClass(_.result(this, 'viewOptions', {}))
      region.show(this.view)
      routerChannel.trigger('route:render', this)
      if (this.viewEvents) {
        Marionette.bindEvents(this, this.view, this.viewEvents)
      }
    },

    getContext() {
      //todo: cache context??
      let state = router.state
      let mnRoutes = (state.activeTransition || state).mnRoutes
      if (!mnRoutes) {
        mnRoutes = state.routes.map(function (route) {
          return mnRouteMap[route.name]
        })
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
    }
  }
)


export function createRouter(options) {
  if (router) {
    throw new Error('Instance of router already created')
  }
  return router = cherrytree(options)
}

export function destroyRouter(instance) {
  router = null
  mnRouteMap = Object.create(null)
  instance.destroy()
}

routerChannel.reply('transitionTo', function () {
  router.transitionTo.apply(router, arguments)
})

routerChannel.reply('goBack', function () {
  //in wait of a better implementation
  history.back();
})

function getChangingIndex(prevRoutes, currentRoutes){
  var index, prev, current;
  const count = Math.max(prevRoutes.length, currentRoutes.length)
  for (index = 0; index < count; index++) {
    prev = prevRoutes[index]
    current = currentRoutes[index]
    if (!(prev && current) || (prev.name !== current.name) || !_.isEqual(prev.params, current.params)) {
      break
    }
  }
  return index
}

function createMnRoute(route) {
  let options = route.options
  let routeOptions = Object.assign({}, options.routeOptions, _.pick(options, ['viewClass', 'viewOptions']))
  if (options.routeClass) {
    return new options.routeClass(routeOptions)
  } else if (options.viewClass || options.abstract) {
    return new Route(routeOptions)
  } else {
    throw new Error(`Unable to create route ${route.name}: routeClass or viewClass must be defined`)
  }
}

function getParentRegion(routes, route) {
  var region, parent
  let routeIndex = routes.indexOf(route) - 1
  while (routeIndex >= 0) {
    parent = routes[routeIndex]
    if (parent.view) {
      region = parent.view.getRegion('outlet')
      if (region) {
        return region
      } else {
        throw new Error('No outlet region in view')
      }
    }
    routeIndex--
  }
  if (!router.rootRegion) {
    throw new Error('No outlet region')
  }
  return router.rootRegion
}

export function middleware(transition) {

  routerChannel.trigger('before:transition', transition)

  if (transition.isCancelled) {
    return
  }

  let prevRoutes = transition.prev.routes
  let changingIndex = getChangingIndex(prevRoutes, transition.routes)
  var routeIndex, routeInstance

  for (routeIndex = prevRoutes.length - 1; routeIndex >= changingIndex; routeIndex--) {
    routeInstance = mnRouteMap[prevRoutes[routeIndex].name]
    if (routeInstance) {
      routerChannel.trigger('before:deactivate', transition, routeInstance)
      if (!transition.isCancelled) {
        routeInstance.deactivate(transition)
        routerChannel.trigger('deactivate', transition, routeInstance)
      }
      if (transition.isCancelled) {
        return
      }
    }
  }

  let mnRoutes = transition.mnRoutes = transition.routes.map(function (route) {
    return mnRouteMap[route.name] || (mnRouteMap[route.name] = createMnRoute(route))
  })

  let activated = mnRoutes.slice(changingIndex)

  let activatePromise = activated.reduce(function (prevPromise, mnRoute) {
    return prevPromise.then(function () {
      if (!transition.isCancelled) {
        routerChannel.trigger('before:activate', transition, mnRoute)
        if (!transition.isCancelled) {
          return Promise.resolve(mnRoute.activate(transition)).then(function () {
            routerChannel.trigger('activate', transition, mnRoute)
          })
        }
      }
      return Promise.resolve()
    })
  }, Promise.resolve())

  transition.then(function () {
    router.state.mnRoutes = mnRoutes
    routerChannel.trigger('transition', transition)
  })

  return activatePromise.then(function () {
    activated.forEach(function (mnRoute) {
      if (mnRoute.viewClass) {
        let parentRegion = getParentRegion(mnRoutes, mnRoute)
        mnRoute.renderView(parentRegion)
      }
    })
  })
}