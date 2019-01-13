# Managing authorization

With Marionete.Routing is possible to implement authorization in a simple, flexible and effective manner

### Using `Route.activate` method

Inside `activate` method of a Route class, check for the user authorization info and take the appropriate action.
Is possible to cancel the transition or redirect to another route.

```javascript
import {Route} from 'marionette.routing';
import {checkAuth} from './my-auth-service'

export const IndexRoute = Route.extend({
  activate (transition) {
    if (!checkAuth()) {
      transition.redirectTo('login')
      //alternatively
      //transition.cancel()
    }
  }
});
```

Since the children routes are always activated after the parent ones, we only
need to test for authentication in the parent route:

```javascript
import {IndexRoute} from './my-route';


router.map(function (route) {
  // Since this top-level route checks authentication, nothing below it needs to
  route('application', {path: '/', class: IndexRoute}, function () {
    route('contacts', {class: ContactsRoute})
    route('login', {component: LoginView})
  })
});
```

### Using `before:activate` event

The above method is simpler than most techniques used in JavaScript applications
but there are some drawbacks. At the time the authorization check is done, the
parent routes will be already activated and, if the transition is cancelled or
redirected, there's the potential to trigger wasteful actions. Also if there are
more than one route to be protected and one is not parent of other, is necessary
to implement the same pattern for each route.

By using `before:activate` event, is possible to overcome those problems keeping
the simplicity. The same behavior as above can be implemented with:

```js
import Radio from 'backbone.radio';
import {checkAuth} from './my-auth-service'

//after configuring the route mapping
Radio.channel('router').on('before:activate', function(transition, route) {
  if (route.requiresAuth && !checkAuth()) {
    transition.redirectTo('login')
    //alternatively
    //transition.cancel()
  }
})
```

In a route that requires to check authorization

```javascript
import {Route} from 'marionette.routing';

export default Route.extend({
  requiresAuth: true
});
```

This [live example](http://codepen.io/blikblum/pen/mWmbQX?editors=1010)
demonstrates how to implement a refined authorization design, with different
access levels and redirect from login to the original requested path.
