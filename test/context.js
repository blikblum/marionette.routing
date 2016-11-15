import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Route, createRouter, destroyRouter, middleware} from '../src/index';

let expect = chai.expect
chai.use(sinonChai)

let router, routes;
let RootRoute, ParentRoute, ChildRoute, GrandChildRoute, LeafRoute;
let currentTransition

describe('Route context', () => {

  beforeEach(() => {
    router = createRouter({location: 'memory'});
    router.use(function (transition) {
      currentTransition = transition
    });
    router.use(middleware);
    RootRoute = Route.extend({}), ParentRoute = Route.extend({}), ChildRoute = Route.extend({}),
      GrandChildRoute = Route.extend({}), LeafRoute = Route.extend({})
    routes = function (route) {
      route('parent', {routeClass: ParentRoute, routeOptions: {x: 1}}, function () {
        route('child', {routeClass: ChildRoute}, function () {
          route('grandchild', {routeClass: GrandChildRoute}, function () {
            route('leaf', {routeClass: LeafRoute})
          })
        })
      })
      route('root', {routeClass: RootRoute})
    }
    router.map(routes);
    router.listen();
  })

  afterEach(() => {
    destroyRouter(router);
  })

  describe('request', () => {

    it('should be replied by a parent route', function (done) {
      let contextValue;
      GrandChildRoute.prototype.contextRequests =  {
        value: function () {
          return 'The Context'
        }
      };
      let leafStub = sinon.stub(LeafRoute.prototype, 'activate', function (transition) {
        contextValue = this.getContext(transition).request('value')
      });
      router.transitionTo('leaf').then(function () {
        expect(contextValue).to.be.equal('The Context');
        done()
      }).catch(done)
    });

    it('should not be replied by a child route', function (done) {
      let contextValue = 'Original Value';
      GrandChildRoute.prototype.contextRequests =  {
        value: function () {
          return 'The Context'
        }
      };
      let childStub = sinon.stub(ChildRoute.prototype, 'activate', function (transition) {
        contextValue = this.getContext(transition).request('value')
      });
      router.transitionTo('leaf').then(function () {
        expect(contextValue).to.be.equal(undefined);
        done()
      }).catch(done)
    });

    it('should be replied by the nearest parent route', function (done) {
      let contextValue;

      ParentRoute.prototype.contextRequests =  {
        value: function () {
          return 'Parent Context'
        }
      };

      GrandChildRoute.prototype.contextRequests =  {
        value: function () {
          return 'Grand Child Context'
        }
      };
      let leafStub = sinon.stub(LeafRoute.prototype, 'activate', function (transition) {
        contextValue = this.getContext(transition).request('value')
      });
      router.transitionTo('leaf').then(function () {
        expect(contextValue).to.be.equal('Grand Child Context');
        done()
      }).catch(done)
    });

    it('should return undefined if no reply is defined in a parent route', function (done) {
      let contextValue = 'Original value';
      GrandChildRoute.prototype.contextRequests =  {
        value: function () {
          return 'The Context'
        }
      };
      let leafStub = sinon.stub(LeafRoute.prototype, 'activate', function (transition) {
        contextValue = this.getContext(transition).request('othervalue')
      });
      router.transitionTo('leaf').then(function () {
        expect(contextValue).to.be.equal(undefined);
        done()
      }).catch(done)
    });

  });

  describe('trigger', () => {

    it('should be captured by a parent route', function (done) {
      let spy = sinon.spy();
      GrandChildRoute.prototype.contextEvents =  {
        'my:event': spy
      };
      let leafStub = sinon.stub(LeafRoute.prototype, 'activate', function (transition) {
        this.getContext(transition).trigger('my:event')
      });
      router.transitionTo('leaf').then(function () {
        expect(spy).to.be.calledOnce;
        done()
      }).catch(done)
    });

    it('should not be captured by a child route', function (done) {
      let spy = sinon.spy();
      GrandChildRoute.prototype.contextEvents =  {
        'my:event': spy
      };
      let childStub = sinon.stub(ChildRoute.prototype, 'activate', function (transition) {
        this.getContext(transition).trigger('my:event')
      });
      router.transitionTo('leaf').then(function () {
        expect(spy).to.not.be.called;
        done()
      }).catch(done)
    });
    
  });

});
