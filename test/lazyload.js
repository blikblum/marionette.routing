import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Route, createRouter, destroyRouter, middleware} from '../src/index';

let expect = chai.expect
chai.use(sinonChai)

let router, routes;
let RootRoute, ParentRoute, ChildRoute, GrandChildRoute, LeafRoute,
  Child2Route, DynParentRoute, DynChildRoute, DynGrandChildRoute;

describe('Route configuration', () => {

  beforeEach(() => {
    router = createRouter({location: 'memory'});

    router.use(middleware);
    RootRoute = Route.extend({}), ParentRoute = Route.extend({}), ChildRoute = Route.extend({}),
      GrandChildRoute = Route.extend({}), LeafRoute = Route.extend({}),
      Child2Route = Route.extend({}), DynParentRoute = Route.extend({}), DynChildRoute = Route.extend({}),
      DynGrandChildRoute = Route.extend({});


    routes = function (route) {
      route('parent', {routeClass: ParentRoute, routeOptions: {x: 1}}, function () {
        route('child', {routeClass: ChildRoute}, function () {
          route('grandchild', {}, function () {
            route('leaf', {})
          })
        })
      })
    }
    router.map(routes);
    router.listen();
  })

  afterEach(() => {
    destroyRouter(router);
  })


  it('can be defined in a parent route class', function () {
    ChildRoute.prototype.childRoutes = function () {
      return {
        grandchild: GrandChildRoute,
        leaf: function () {
          return LeafRoute
        }
      }
    };
    let spy = sinon.spy(GrandChildRoute.prototype, 'initialize');
    let spy2 = sinon.spy(LeafRoute.prototype, 'initialize');
    return router.transitionTo('leaf').then(function () {
      expect(spy).to.be.calledOnce;
      expect(spy2).to.be.calledOnce;
    })
  });

  it('can be loaded asynchronously', function () {
    ChildRoute.prototype.childRoutes = function () {
      return {
        grandchild: GrandChildRoute,
        leaf: function () {
          let promise = new Promise(function (resolve) {
            setTimeout(function () {
              resolve()
            }, 200)
          })
          return promise.then(function () {
            return LeafRoute
          })
        }
      }
    };
    let spy = sinon.spy(LeafRoute.prototype, 'initialize');
    return router.transitionTo('leaf').then(function () {
      expect(spy).to.be.calledOnce;
    })
  });

});
