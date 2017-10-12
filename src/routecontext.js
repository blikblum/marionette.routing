function RouteContext (routes, route) {
  let routeIndex = routes.indexOf(route)
  this.parentRoutes = routes.slice(0, routeIndex)
}

RouteContext.prototype.trigger = function () {
  let parentRoutes = this.parentRoutes
  for (let i = parentRoutes.length - 1; i >= 0; i--) {
    let channel = parentRoutes[i]._contextChannel
    if (channel) {
      channel.trigger.apply(channel, arguments)
    }
  }
}

RouteContext.prototype.request = function (name) {
  let parentRoutes = this.parentRoutes
  for (let i = parentRoutes.length - 1; i >= 0; i--) {
    let channel = parentRoutes[i]._contextChannel
    if (channel && channel._requests[name]) {
      return channel.request.apply(channel, arguments)
    }
  }
}

export default RouteContext
