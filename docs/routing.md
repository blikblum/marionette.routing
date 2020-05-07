# Guide to Routing

This guide to routing provides some simple information for building a router
using `marionette.routing`. For the purposes of this guide, we'll assume that
you're using an application configuration that supports the push state API. We
will also assume that you've configured your environment to support at least ES6.

## Creating a Router

To create a router, simply call the `createRouter` function and set some options
to start handling route changes.

### `router.js`

```js
import { createRouter, middleware } from 'marionette.routing';

let router = null;

/**
 * Return the router instance, creating it if it doesn't exist yet.
*/
export function getRouter(app) {
  if (!router) {
    router = createRouter({
      log: true,
      pushState: true
    });

    router.rootRegion = app.getRegion();
  }

  return router;
}
```

### `app.js`

```js
import { Application } from 'backbone.marionette';
import { getRouter } from './router';

const App = Application.extend({
  region: '#app',

  onStart() {
    this.router = getRouter(this);
    this.router.listen();  // Start the router.
  }
});

app.start();
```

## Mapping your Routes

Now we have a simple router implementation, let's map our initial routes and the
views we want to display when the app first loads.

### Extending `router.js`

```js
import { mapRoutes } from './routes';


export function getRouter(app) {
  if (!router) {
    router = createRouter({
      log: true,
      pushState: true
    });

    router.rootRegion = app.getRegion();

    mapRoutes(router);  // <-- THIS IS IMPORTANT - SEE BELOW
  }

  return router;
}
```

### `routes.js`

Our `routes.js` file will contain the skeleton of our application routing
structure. Using the `router.map` method, we setup routes throughout our app and
tell it which views or sub-routes it needs to use.

```js
import { IndexView } from './views';
import { LoginRoute } from './auth/view';


/**
 * Sets up all the routes for our application. Takes the router as its argument.
*/
export function mapRoutes(router) {
  router.map(route => {
    route('app', { path: '/', abstract: true }, () => {
      route('index', { path: '', viewClass: IndexView });
      route('login', { routeClass: LoginRoute });
    });
  });
}
```

Let's break this down bit by bit:

1. `router.map`: sets up the callback and route handler
