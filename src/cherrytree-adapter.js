/* global history */
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
import Cherrytree from 'cherrytreex'
import Route from './route'

let mnRouteMap = Object.create(null)
export const routerChannel = Radio.channel('router')
let router

export function createRouter (options) {
  if (router) {
    throw new Error('Instance of router already created')
  }
  router = Route.prototype.$router = new Cherrytree(options)
  return router
}

export function destroyRouter (instance) {
  router = null
  Route.prototype.$router = null
  mnRouteMap = Object.create(null)
  instance.destroy()
}

export function getMnRoutes (routes) {
  return routes.map(function (route) {
    return mnRouteMap[route.name]
  })
}

routerChannel.reply('transitionTo', function () {
  return router.transitionTo.apply(router, arguments)
})

routerChannel.reply('isActive', function () {
  return router.isActive.apply(router, arguments)
})

routerChannel.reply('generate', function () {
  return router.generate.apply(router, arguments)
})

routerChannel.reply('goBack', function () {
  // in wait of a better implementation
  history.back()
})

function getChangingIndex (prevRoutes, currentRoutes) {
  let index, prev, current
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

function findRouteConfig (routeName, index, routes) {
  let parentRoutes = routes.slice(0, index).reverse().map(function (route) {
    return mnRouteMap[route.name]
  })
  let config
  parentRoutes.some(function (route) {
    let childRoutes = _.result(route, 'childRoutes')
    config = childRoutes && childRoutes[routeName]
    if (_.isFunction(config) && !(config.prototype instanceof Route)) {
      config = config.call(route)
    }
    return config
  })
  return config
}

function createRouteInstance (options, config) {
  if (options.__esModule) options = options.default
  if (options.prototype instanceof Route) {
    return new options(undefined, config) // eslint-disable-line new-cap
  }
  let routeOptions = _.extend({}, options.routeOptions, _.pick(options, ['viewClass', 'viewOptions']))
  if (options.routeClass) {
    return new options.routeClass(routeOptions, config) // eslint-disable-line new-cap
  } else if (options.viewClass) {
    return new Route(routeOptions, config)
  }
}

function createMnRoute (route, index, routes) {
  let instanceConfig = {
    name: route.name,
    path: route.path,
    options: _.clone(route.options)
  }
  let instance = createRouteInstance(route.options, instanceConfig)
  if (!instance) {
    let routeConfig = findRouteConfig(route.name, index, routes)
    return Promise.resolve(routeConfig).then(function (options) {
      return options && createRouteInstance(options, instanceConfig)
    })
  }
  return instance
}

function getParentRegion (routes, route) {
  let region, parent
  let routeIndex = routes.indexOf(route) - 1
  while (routeIndex >= 0) {
    parent = routes[routeIndex]
    if (parent.view && parent.$config.options.outlet !== false) {
      region = parent.getOutlet()
      if (region) {
        return region
      } else {
        throw new Error(`No outlet region defined in ${parent.$config.name} route`)
      }
    }
    routeIndex--
  }
  return router.rootRegion
}

function renderViews (mnRoutes, activated, transition) {
  // ensure at least the target (last) route is rendered
  let renderCandidates = activated.length ? activated : mnRoutes.slice(-1)

  let renderQueue = renderCandidates.reduce(function (memo, mnRoute) {
    if (mnRoute.viewClass) {
      if (memo.length && memo[memo.length - 1].$config.options.outlet === false) {
        memo.pop()
      }
      memo.push(mnRoute)
    }
    return memo
  }, [])

  renderQueue.forEach(function (mnRoute) {
    let parentRegion = getParentRegion(mnRoutes, mnRoute)
    mnRoute.renderView(parentRegion, transition)
  })
}

function runAsyncMethod (transition, routes, method) {
  return routes.reduce(function (prevPromise, mnRoute) {
    routerChannel.trigger(`before:${method}`, transition, mnRoute)
    return prevPromise.then(function () {
      if (!transition.isCancelled) {
        return Promise.resolve(mnRoute[method](transition)).then(function () {
          if (!transition.isCancelled) {
            routerChannel.trigger(method, transition, mnRoute)
          }
        })
      }
      return Promise.resolve()
    })
  }, Promise.resolve())
}

function isActivatingRoute (route) {
  return this.activating && this.activating.indexOf(route) !== -1
}

function isTargetRoute (route) {
  return this.mnRoutes && this.mnRoutes.indexOf(route) === this.mnRoutes.length - 1
}

export const middleware = {
  next: function routeResolver (transition) {
    transition.isActivating = isActivatingRoute
    transition.isTarget = isTargetRoute

    routerChannel.trigger('before:transition', transition)

    if (transition.isCancelled) return

    let prevRoutes = transition.prev.routes
    let changingIndex = getChangingIndex(prevRoutes, transition.routes)
    let deactivated = []
    let routeIndex, routeInstance

    // deactivate previous routes
    for (routeIndex = prevRoutes.length - 1; routeIndex >= changingIndex; routeIndex--) {
      routeInstance = mnRouteMap[prevRoutes[routeIndex].name]
      if (routeInstance) {
        deactivated.push(routeInstance)
      }
    }

    let promise = runAsyncMethod(transition, deactivated, 'deactivate')

    // build route tree and creating instances if necessary
    let mnRoutes = transition.mnRoutes = []

    promise = promise.then(() => {
      return transition.routes.reduce(function (acc, route, i, routes) {
        return acc.then(function (res) {
          let instance = mnRouteMap[route.name]
          if (instance) {
            res.push(instance)
            return res
          } else {
            instance = createMnRoute(route, i, routes)
            return Promise.resolve(instance).then(function (mnRoute) {
              if (!mnRoute) {
                throw new Error(`Unable to create route ${route.name}: routeClass or viewClass must be defined`)
              }
              mnRouteMap[route.name] = mnRoute
              res.push(mnRoute)
              return res
            })
          }
        })
      }, Promise.resolve(mnRoutes))
    })

    // activate routes in order
    let activated

    promise = promise.then(function () {
      activated = transition.activating = mnRoutes.slice(changingIndex)
      return runAsyncMethod(transition, activated, 'activate')
    })

    promise.catch(() => {
      // catch errors occurred inside routing classes / methods
      // Should be handled in error event or in a transition.catch method
    })

    // render views
    return promise.then(function () {
      if (transition.isCancelled) return

      let loadPromise = mnRoutes.reduce(function (prevPromise, mnRoute) {
        let nextPromise = prevPromise
        if (_.isFunction(mnRoute.load)) {
          if (prevPromise) {
            return prevPromise.then(function () {
              return Promise.resolve(mnRoute.load(transition))
            }).catch(function () {
              return Promise.resolve(mnRoute.load(transition))
            })
          } else {
            return Promise.resolve(mnRoute.load(transition))
          }
        }
        return nextPromise
      }, undefined)

      if (loadPromise) {
        return new Promise(function (resolve) {
          loadPromise.then(function () {
            renderViews(mnRoutes, activated, transition)
            resolve()
          }).catch(function () {
            renderViews(mnRoutes, activated, transition)
            resolve()
          })
        })
      } else {
        renderViews(mnRoutes, activated, transition)
      }
    })
  },

  done: function (transition) {
    router.state.mnRoutes = transition.mnRoutes
    routerChannel.trigger('transition', transition)
    transition.activating = []
  },

  error: function (transition, err) {
    transition.activating = []
    if (err.type !== 'TransitionCancelled' && err.type !== 'TransitionRedirected') {
      routerChannel.trigger('transition:error', transition, err)
    }
  }
}
