import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Route, createRouter, destroyRouter, middleware} from '../src/index';

let expect = chai.expect
chai.use(sinonChai)

let router, routes;
let RootRoute, ParentRoute, ChildRoute, GrandChildRoute, LeafRoute;
let currentTransition

function createRouteClass() {
  return Route.extend({
    initialize() {
    },
    activate() {
    }
  });
}

describe('Lifecycle hooks', () => {

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

  describe('initialize', () => {

    it('should be called once with routeOptions', function (done) {
      let spy = sinon.spy(ParentRoute.prototype, 'initialize');
      router.transitionTo('parent').then(function () {
        expect(spy).to.be.calledOnce;
        expect(spy).to.be.calledWith({x: 1})
        done()
      }).catch(done)
    });

    it('should be called once even when enter route a second time', function (done) {
      let spy = sinon.spy(RootRoute.prototype, 'initialize')
      router.transitionTo('root').then(function () {
        return router.transitionTo('parent');
      }).then(function () {
        return router.transitionTo('root');
      }).then(function () {
        expect(spy).to.have.been.calledOnce;
        done();
      }).catch(done);
    })

    it('should be called in order from root to leave once', function (done) {
      let parentSpy = sinon.spy(ParentRoute.prototype, 'initialize');
      let childSpy = sinon.spy(ChildRoute.prototype, 'initialize');
      let grandChildSpy = sinon.spy(GrandChildRoute.prototype, 'initialize');
      let leafSpy = sinon.spy(LeafRoute.prototype, 'initialize');
      router.transitionTo('leaf').then(function () {
        return router.transitionTo('root')
      }).then(function () {
        return router.transitionTo('leaf');
      }).then(function () {
        //once
        expect(parentSpy).to.have.been.calledOnce;
        expect(childSpy).to.have.been.calledOnce;
        expect(grandChildSpy).to.have.been.calledOnce;
        expect(leafSpy).to.have.been.calledOnce;
        //order
        expect(childSpy).to.have.been.calledAfter(parentSpy);
        expect(grandChildSpy).to.have.been.calledAfter(childSpy);
        expect(leafSpy).to.have.been.calledAfter(grandChildSpy);
        done()
      }).catch(done)
    })
  });


  describe('activate', () => {
    it('should be called once with transition when enter route', function (done) {
      let spy = sinon.spy(ParentRoute.prototype, 'activate');
      router.transitionTo('parent').then(function () {
        expect(spy).to.be.calledOnce;
        expect(spy).to.be.calledWith(currentTransition)
        done()
      }).catch(done)
    });

    it('should be called twice when enter route a second time', function (done) {
      let spy = sinon.spy(RootRoute.prototype, 'activate')
      router.transitionTo('root').then(function () {
        return router.transitionTo('parent');
      }).then(function () {
        return router.transitionTo('root');
      }).then(function () {
        expect(spy).to.have.been.calledTwice;
        done();
      }).catch(done);
    })

    it('should be called in order from root to leaf, once', function (done) {
      let parentSpy = sinon.spy(ParentRoute.prototype, 'activate');
      let childSpy = sinon.spy(ChildRoute.prototype, 'activate');
      let grandChildSpy = sinon.spy(GrandChildRoute.prototype, 'activate');
      let leafSpy = sinon.spy(LeafRoute.prototype, 'activate');
      router.transitionTo('leaf').then(function () {
        //once
        expect(parentSpy).to.have.been.calledOnce;
        expect(childSpy).to.have.been.calledOnce;
        expect(grandChildSpy).to.have.been.calledOnce;
        expect(leafSpy).to.have.been.calledOnce;
        //order
        expect(childSpy).to.have.been.calledAfter(parentSpy);
        expect(grandChildSpy).to.have.been.calledAfter(childSpy);
        expect(leafSpy).to.have.been.calledAfter(grandChildSpy);
        done()
      }).catch(done)
    })
  });

  describe('deactivate', () => {
    it('should be called once with transition when leave route', function (done) {
      let spy = sinon.spy(ParentRoute.prototype, 'deactivate');
      router.transitionTo('parent').then(function () {
        return router.transitionTo('root')
      }).then(function () {
        expect(spy).to.be.calledOnce;
        expect(spy).to.be.calledWith(currentTransition)
        done()
      }).catch(done)
    });

    it('should be called twice when leave route a second time', function (done) {
      let spy = sinon.spy(RootRoute.prototype, 'deactivate')
      router.transitionTo('root').then(function () {
        return router.transitionTo('parent');
      }).then(function () {
        return router.transitionTo('root');
      }).then(function () {
        return router.transitionTo('parent');
      }).then(function () {
        expect(spy).to.have.been.calledTwice;
        done();
      }).catch(done);
    })

    it('should be called in order from leaf to root, once', function (done) {
      let parentSpy = sinon.spy(ParentRoute.prototype, 'deactivate');
      let childSpy = sinon.spy(ChildRoute.prototype, 'deactivate');
      let grandChildSpy = sinon.spy(GrandChildRoute.prototype, 'deactivate');
      let leafSpy = sinon.spy(LeafRoute.prototype, 'deactivate');
      router.transitionTo('leaf').then(function () {
        return router.transitionTo('root')
      }).then(function () {
        //once
        expect(parentSpy).to.have.been.calledOnce;
        expect(childSpy).to.have.been.calledOnce;
        expect(grandChildSpy).to.have.been.calledOnce;
        expect(leafSpy).to.have.been.calledOnce;
        //order
        expect(grandChildSpy).to.have.been.calledAfter(leafSpy);
        expect(childSpy).to.have.been.calledAfter(grandChildSpy);
        expect(parentSpy).to.have.been.calledAfter(childSpy);
        done()
      }).catch(done)
    })
  });


});
