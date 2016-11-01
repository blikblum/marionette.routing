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

let routeInstances = Object.create(null)
let routerChannel = Radio.channel('router')
let router

function getParentInstances(index, transition) {
  let activeInstances = transition.routes.map(function (value) {
    return routeInstances[value.name]
  })
  return activeInstances.slice(0, index)
}

class RouteContext {
  constructor(route, transition) {
    let routeIndex = _.findIndex(transition.routes, function (value) {
      return route === routeInstances[value.name]
    })
    this.parentInstances = getParentInstances(routeIndex, transition)
  }

  trigger() {
    //todo
  }

  request(name) {
    let parentInstances = this.parentInstances
    for (let i = parentInstances.length - 1; i >= 0; i--) {
      let instance = parentInstances[i]
      if (instance._contextChannel && instance._contextChannel._requests[name]) {
        return instance._contextChannel.request(name)
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
    },

    getContext(transition) {
      //todo: cache context??
      return new RouteContext(this, transition)
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
  routeInstances = Object.create(null)
  instance.destroy()
}

routerChannel.reply('transitionTo', function () {
  router.transitionTo.apply(router, arguments)
})

routerChannel.reply('goBack', function () {
  //in wait of a better implementation
  global.history.back();
})

function getChangingRoutes(prev, current){
  //todo: consider params changes
  let i, prevName, currentName;
  const count = Math.max(prev.length, current.length)
  for (i = 0; i < count; i++) {
    prevName = prev[i] ? prev[i].name : null
    currentName = current[i] ? current[i].name : null
    if (prevName !== currentName) {
      break
    }
  }
  return {
    activated: current.slice(i),
    deactivated: prev.slice(i).reverse()
  }
}

function createRouteInstance(options) {
  let routeOptions = Object.assign({}, options.routeOptions, _.pick(options, ['viewClass', 'viewOptions']))
  if (options.routeClass) {
    return new options.routeClass(routeOptions)
  } else if (options.viewClass || options.abstract) {
    return new Route(routeOptions)
  } else {
    throw 'Unable to create route instance: routeClass or viewClass must be defined'
  }
}

function getParentRegion(routes, routeIndex) {
  let region
  let parent
  routeIndex--
  while (routeIndex >= 0) {
    parent = routeInstances[routes[routeIndex].name]
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
  const {activated, deactivated} = getChangingRoutes(transition.prev.routes, transition.routes)

  deactivated.some(function (route) {
    var instance = routeInstances[route.name]
    if (instance) {
      instance.deactivate(transition)
    }
    return transition.isCancelled
  })

  if (transition.isCancelled) {
    return
  }

  let activatePromise = activated.reduce(function (prevPromise, route) {
    let instance = routeInstances[route.name] || (routeInstances[route.name] = createRouteInstance(route.options))

    return prevPromise.then(function () {
      console.log('calling activate', route.name)
      if (!transition.isCancelled) {
        return Promise.resolve(instance.activate(transition))
      } else {
        return Promise.resolve()
      }
    })
  }, Promise.resolve())

  return activatePromise.then(function () {
    activated.forEach(function (route) {
      let instance = routeInstances[route.name]
      let parentRegion
      if (instance.viewClass) {
        parentRegion = getParentRegion(transition.routes, transition.routes.indexOf(route))
        instance.renderView(parentRegion)
      }
    })
  }).catch(function (error) {
    console.log('error activating: ', error)
  })
}

