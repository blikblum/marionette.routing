# Router Configuration
 
### `createRouter(options)`
 
 Returns a cherrytree router instance. Accepts an options hash as argument:

 * **options.log** - a function that is called with logging info, default is noop. Pass in `true`/`false` or a custom logging function.
 * **options.logError** - default is true. A function that is called when transitions error (except for the special `TransitionRedirected` and `TransitionCancelled` errors). Pass in `true`/`false` or a custom error handling function.
 * **options.pushState** - default is false, which means using hashchange events. Set to `true` to use pushState.
 * **options.root** - default is `/`. Use in combination with `pushState: true` if your application is not being served from the root url /.
 * **options.interceptLinks** - default is true. When pushState is used - intercepts all link clicks when appropriate, prevents the default behaviour and instead uses pushState to update the URL and handle the transition via the router. You can also set this option to a custom function that will get called whenever a link is clicked if you want to customize the behaviour. Read more on [intercepting links below](#intercepting-links).
 * **options.qs** - default is a simple built in query string parser. Pass in an object with `parse` and `stringify` functions to customize how query strings get treated.
 * **options.Promise** - default is window.Promise or global.Promise. Promise implementation to be used when constructing transitions.

### `router.map(fn)`

Configure the router with a route map. e.g.

```js
router.map(function (route) {
  route('app', {path: '/', abstract: true}, function () {
    route('about', {viewClass: AboutView, viewOptions: {version: '1.0'}})
    route('post', {path: ':postId', routeClass: PostRoute}, function () {
      route('edit', {routeClass: PostRoute, viewClass: EditPostView})
    })
  })
})
```

Each route can be configure with the following options:

 * routeClass: a Route class
 * routeOptions: options passed to the Route constructor
 * viewClass: a Marionette.View class. Can be used alone or with routeClass
 * viewOptions: options passed to the Marionette.View constructor
 * path: the route path
 * abstract: pass true to define an abstract route
 * outlet: pass true to allow a viewClass without a outlet region

All routes must have at least viewClass or routeClass defined.

For more information about route mapping refer to cherrytree documentation
 
### `router.listen`
 
 Starts listening for URL changes

### `router.rootRegion`
 
 Property that defines the region where the top level views will be rendered

### `middleware`
 
  A cherrytree middleware to be used by the route. Probably will be removed from public interface in the future  

### `destroyRouter(routerInstance)`   

  Cleanup a router. Mostly used in tests
    