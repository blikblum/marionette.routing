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
import cherrytree from 'cherrytree'
import Route from './route'

let mnRouteMap = Object.create(null)
export const routerChannel = Radio.channel('router')
let router

export function createRouter(options) {
  if (router) {
    throw new Error('Instance of router already created')
  }
  return router = Route.prototype.$router = cherrytree(options)
}

export function destroyRouter(instance) {
  router = null
  Route.prototype.$router = null
  mnRouteMap = Object.create(null)
  instance.destroy()
}

export function getMnRoutes(routes) {
  return routes.map(function (route) {
    return mnRouteMap[route.name]
  })
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