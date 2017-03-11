(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('underscore'), require('backbone.radio'), require('backbone.marionette'), require('cherrytree')) :
  typeof define === 'function' && define.amd ? define(['exports', 'underscore', 'backbone.radio', 'backbone.marionette', 'cherrytree'], factory) :
  (factory((global.Backbone = global.Backbone || {}, global.Backbone.Marionette = global.Backbone.Marionette || {}, global.Backbone.Marionette.Routing = global.Backbone.Marionette.Routing || {}),global._,global.Backbone.Radio,global.Backbone.Marionette,global.cherrytree));
}(this, (function (exports,_,Radio,Marionette,cherrytree) { 'use strict';

_ = 'default' in _ ? _['default'] : _;
Radio = 'default' in Radio ? Radio['default'] : Radio;
Marionette = 'default' in Marionette ? Marionette['default'] : Marionette;
cherrytree = 'default' in cherrytree ? cherrytree['default'] : cherrytree;

function RouteContext(routes, route) {
  var routeIndex = routes.indexOf(route);
  this.parentRoutes = routes.slice(0, routeIndex);
}

RouteContext.prototype.trigger = function () {
  var parentRoutes = this.parentRoutes;
  for (var i = parentRoutes.length - 1; i >= 0; i--) {
    var channel = parentRoutes[i]._contextChannel;
    if (channel) {
      channel.trigger.apply(channel, arguments);
    }
  }
};

RouteContext.prototype.request = function (name) {
  var parentRoutes = this.parentRoutes;
  for (var i = parentRoutes.length - 1; i >= 0; i--) {
    var channel = parentRoutes[i]._contextChannel;
    if (channel && channel._requests[name]) {
      return channel.request.apply(channel, arguments);
    }
  }
};

/**
 * Marionette Routing
 *
 * Copyright © 2015-2016 Luiz Américo Pereira Câmara. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

var mnRouteMap = Object.create(null);
var routerChannel = Radio.channel('router');
var router = void 0;

function createRouter(options) {
  if (router) {
    throw new Error('Instance of router already created');
  }
  return router = Route.prototype.$router = cherrytree(options);
}

function destroyRouter(instance) {
  router = null;
  Route.prototype.$router = null;
  mnRouteMap = Object.create(null);
  instance.destroy();
}

function getMnRoutes(routes) {
  return routes.map(function (route) {
    return mnRouteMap[route.name];
  });
}

routerChannel.reply('transitionTo', function () {
  return router.transitionTo.apply(router, arguments);
});

routerChannel.reply('isActive', function () {
  return router.isActive.apply(router, arguments);
});

routerChannel.reply('generate', function () {
  return router.generate.apply(router, arguments);
});

routerChannel.reply('goBack', function () {
  //in wait of a better implementation
  history.back();
});

function getChangingIndex(prevRoutes, currentRoutes) {
  var index, prev, current;
  var count = Math.max(prevRoutes.length, currentRoutes.length);
  for (index = 0; index < count; index++) {
    prev = prevRoutes[index];
    current = currentRoutes[index];
    if (!(prev && current) || prev.name !== current.name || !_.isEqual(prev.params, current.params)) {
      break;
    }
  }
  return index;
}

function findRouteConfig(routeName, index, routes) {
  var parentRoutes = routes.slice(0, index).reverse().map(function (route) {
    return mnRouteMap[route.name];
  });
  var config = void 0;
  parentRoutes.some(function (route) {
    var childRoutes = _.result(route, 'childRoutes');
    config = childRoutes && childRoutes[routeName];
    if (_.isFunction(config) && !(config.prototype instanceof Route)) {
      config = config.call(route);
    }
    return config;
  });
  return config;
}

function createRouteInstance(options, config) {
  if (options.prototype instanceof Route) {
    return new options(undefined, config);
  }
  var routeOptions = _.extend({}, options.routeOptions, _.pick(options, ['viewClass', 'viewOptions']));
  if (options.routeClass) {
    return new options.routeClass(routeOptions, config);
  } else if (options.viewClass) {
    return new Route(routeOptions, config);
  }
}

function createMnRoute(route, index, routes) {
  var instanceConfig = {
    name: route.name,
    path: route.path,
    options: _.clone(route.options)
  };
  var instance = createRouteInstance(route.options, instanceConfig);
  if (!instance) {
    var routeConfig = findRouteConfig(route.name, index, routes);
    return Promise.resolve(routeConfig).then(function (options) {
      return options && createRouteInstance(options, instanceConfig);
    });
  }
  return instance;
}

function getParentRegion(routes, route) {
  var region, parent;
  var routeIndex = routes.indexOf(route) - 1;
  while (routeIndex >= 0) {
    parent = routes[routeIndex];
    if (parent.view && parent.$config.options.outlet !== false) {
      region = parent.getOutlet();
      if (region) {
        return region;
      } else {
        throw new Error('No outlet region defined in ' + parent.$config.name + ' route');
      }
    }
    routeIndex--;
  }
  return router.rootRegion;
}

function middleware(transition) {

  routerChannel.trigger('before:transition', transition);

  if (transition.isCancelled) return;

  var prevRoutes = transition.prev.routes;
  var changingIndex = getChangingIndex(prevRoutes, transition.routes);
  var routeIndex,
      routeInstance,
      deactivated = [];

  //deactivate previous routes
  for (routeIndex = prevRoutes.length - 1; routeIndex >= changingIndex; routeIndex--) {
    routeInstance = mnRouteMap[prevRoutes[routeIndex].name];
    if (routeInstance) {
      deactivated.push(routeInstance);
    }
  }

  if (deactivated.some(function (route) {
    routerChannel.trigger('before:deactivate', transition, route);
    return transition.isCancelled;
  })) return;

  if (deactivated.some(function (route) {
    route.deactivate(transition);
    routerChannel.trigger('deactivate', transition, route);
    return transition.isCancelled;
  })) return;

  //build route tree and creating instances if necessary
  var mnRoutes = transition.mnRoutes = [];

  var promise = transition.routes.reduce(function (acc, route, i, routes) {
    return acc.then(function (res) {
      var instance = mnRouteMap[route.name];
      if (instance) {
        res.push(instance);
        return res;
      } else {
        instance = createMnRoute(route, i, routes);
        return Promise.resolve(instance).then(function (mnRoute) {
          if (!mnRoute) {
            throw new Error('Unable to create route ' + route.name + ': routeClass or viewClass must be defined');
          }
          mnRouteMap[route.name] = mnRoute;
          res.push(mnRoute);
          return res;
        });
      }
    });
  }, Promise.resolve(mnRoutes));

  //activate routes in order
  var activated = void 0;

  promise = promise.then(function () {
    activated = mnRoutes.slice(changingIndex);
    return activated.reduce(function (prevPromise, mnRoute) {
      routerChannel.trigger('before:activate', transition, mnRoute);
      return prevPromise.then(function () {
        if (!transition.isCancelled) {
          return Promise.resolve(mnRoute.activate(transition)).then(function () {
            if (!transition.isCancelled) {
              routerChannel.trigger('activate', transition, mnRoute);
            }
          });
        }
        return Promise.resolve();
      });
    }, Promise.resolve());
  });

  transition.then(function () {
    router.state.mnRoutes = mnRoutes;
    routerChannel.trigger('transition', transition);
  }).catch(function (err) {
    if (err.type !== 'TransitionCancelled' && err.type !== 'TransitionRedirected') {
      routerChannel.trigger('transition:error', transition, err);
    }
  });

  //render views
  return promise.then(function () {
    if (transition.isCancelled) return;
    //ensure at least the target (last) route is rendered
    if (!activated.length && mnRoutes.length) {
      activated.push(mnRoutes[mnRoutes.length - 1]);
    }

    var renderQueue = activated.reduce(function (memo, mnRoute) {
      if (mnRoute.viewClass) {
        if (memo.length && memo[memo.length - 1].$config.options.outlet === false) {
          memo.pop();
        }
        memo.push(mnRoute);
      }
      return memo;
    }, []);

    renderQueue.forEach(function (mnRoute) {
      var parentRegion = getParentRegion(mnRoutes, mnRoute);
      mnRoute.renderView(parentRegion, transition);
    });
  });
}

var Route = Marionette.Object.extend({
  constructor: function constructor(options, config) {
    this.mergeOptions(options, ['viewClass', 'viewOptions']);
    this.$config = config;
    Marionette.Object.call(this, options);
    this._bindContext();
  },


  cidPrefix: 'rou',

  activate: function activate() {},
  deactivate: function deactivate() {},
  renderView: function renderView(region, transition) {
    //todo: move renderView out of Route class??
    if (!this.viewClass) {
      throw new Error('render: viewClass not defined');
    }
    if (this.view && this.updateView(transition)) return;
    var view = new this.viewClass(_.result(this, 'viewOptions', {}));
    this.listenToOnce(view, 'destroy', function () {
      this.view = void 0;
    });
    if (region) {
      region.show(view);
    } else {
      // if region is undefined means no rootRegion is defined
      // accept a pre-rendered view in those situations throwing otherwise
      if (!view.isRendered()) throw new Error('No root outlet region defined');
    }
    this.view = view;
    routerChannel.trigger('route:render', this);
    if (this.viewEvents) {
      Marionette.bindEvents(this, view, this.viewEvents);
    }
  },
  updateView: function updateView() {},
  getContext: function getContext() {
    //todo: cache context??
    var state = this.$router.state;
    var mnRoutes = (state.activeTransition || state).mnRoutes;
    if (!mnRoutes) {
      mnRoutes = getMnRoutes(state.routes);
    }
    return new RouteContext(mnRoutes, this);
  },
  getOutlet: function getOutlet() {
    return this.view.getRegion('outlet');
  },
  _bindContext: function _bindContext() {
    var channel = void 0,
        requests = _.result(this, 'contextRequests'),
        events = _.result(this, 'contextEvents');
    if (!requests && !events) {
      return;
    }

    this._contextChannel = channel = new Radio.Channel('__routeContext_' + this.cid);

    this.bindRequests(channel, requests);
    this.bindEvents(channel, events);
  },


  $router: null
});

function getRouteParams(el) {
  var result = {};
  var attributes = el.attributes;

  for (var i = 0; i < attributes.length; i++) {
    var attr = attributes[i];
    if (attr.name.indexOf('param-') === 0) {
      var paramName = attr.name.slice('param-'.length);
      result[paramName] = attr.value;
    }
  }
  return result;
}

function createLinks(view) {
  var $routes = view.$('[route]');

  $routes.each(function () {
    var routeName = this.getAttribute('route');
    if (!routeName) return;
    var params = getRouteParams(this);
    var href = routerChannel.request('generate', routeName, params);
    if (this.tagName === 'A') {
      this.setAttribute('href', href);
    } else {
      view.$(this).find('a').eq(0).attr({ href: href });
    }
  });
}

var routerlink = Marionette.Behavior.extend({
  initialize: function initialize() {
    var view = this.view;
    this.listenTo(routerChannel, 'transition', this.onTransition);
    if (view.el) {
      view.initialize = _.wrap(view.initialize, function (fn) {
        var args = _.rest(arguments, 1);
        fn.apply(view, args);
        if (view.isRendered()) createLinks(view);
      });
    }
  },


  events: {
    'click [route]:not(a)': 'onLinkClick'
  },

  onTransition: function onTransition() {
    var view = this.view;
    this.$('[route]').each(function () {
      var $el = view.$(this);
      var routeName = $el.attr('route');
      if (!routeName) return;
      var isActive = routerChannel.request('isActive', routeName, getRouteParams(this));
      $el.toggleClass('active', isActive);
    });
  },
  onLinkClick: function onLinkClick(e) {
    var el = e.currentTarget;
    if (this.$(el).find('a').length) return;
    var routeName = el.getAttribute('route');
    if (!routeName) return;
    var params = getRouteParams(el);
    routerChannel.request('transitionTo', routeName, params);
  },
  onRender: function onRender() {
    createLinks(this.view);
  },
  onDestroy: function onDestroy() {
    this.stopListening(routerChannel);
  }
});

/**
 * Marionette Routing
 *
 * Copyright © 2015-2016 Luiz Américo Pereira Câmara. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

exports.Route = Route;
exports.RouterLink = routerlink;
exports.middleware = middleware;
exports.createRouter = createRouter;
exports.destroyRouter = destroyRouter;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=index.umd.js.map
