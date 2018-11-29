# Route lazy loading

The route definitions can be loaded dynamically allowing to implement code splitting
 
Example extracted from [Marionette Wires Revisited](https://github.com/blikblum/marionette-wires-revisited) (using webpack API):

 
Route map (the route map configuration must be defined upfront)
```javascript
router.map(function (route) {
  route('app', {path: '/', routeClass: ApplicationRoute, abstract: true}, function () {   
    route('colors', {path: 'colors'}, function () {
      route('colors.index', {path: 'index'});
      route('colors.create', {path: 'new'});
      route('colors.show', {path: ':colorid'});
      route('colors.edit', {path: ':colorid/edit'});
    });
    route('books', {path: 'books', routeClass: BooksRoute}, function () {
      route('books.index', {path: 'index', viewClass: BooksIndexView});
      route('books.show', {path: ':bookid', routeClass: BooksShowRoute});
    });
  })
});
``` 

ApplicationRoute (in childRoutes, a promise is returned for colors route)
```javascript
import {Route} from 'marionette.routing';

export default Route.extend({
  childRoutes: {
    colors: function () {
      return import('../colors/route');
    }
  }
});
```    

ColorsRoute (in childRoutes, route definitions)
```javascript
import {Route} from 'marionette.routing';
import ColorsIndexRoute from './index/route';
import ColorsShowRoute from './show/route';
import ColorsEditRoute from './edit/route';
import ColorsCreateRoute from './create/route';

export default Route.extend({
  childRoutes: {
    'colors.index': ColorsIndexRoute,
    'colors.show': ColorsShowRoute,
    'colors.edit': ColorsEditRoute,
    'colors.create': ColorsCreateRoute
  }
});
```
  
With the above setup, all code referenced by ColorsRoute, including its children routes, will be 
saved in a separated bundle and will be loaded only after 'colors' or one of its children routes are
visited for the first time