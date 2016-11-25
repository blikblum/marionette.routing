export default class RouteContext {
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
