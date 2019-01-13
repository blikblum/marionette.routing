/* eslint-disable no-unused-expressions */
/* global describe,beforeEach,afterEach,it */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { Route, Router } from '../src/index'

let expect = chai.expect
chai.use(sinonChai)

let router, routes
let RootRoute, ParentRoute, ChildRoute, GrandChildRoute, LeafRoute

describe('Route context', () => {
  beforeEach(() => {
    router = new Router({ location: 'memory' })
    RootRoute = class extends Route {}
    ParentRoute = class extends Route {}
    ChildRoute = class extends Route {}
    GrandChildRoute = class extends Route {}
    LeafRoute = class extends Route {}
    routes = function (route) {
      route('parent', { class: ParentRoute, routeOptions: { x: 1 } }, function () {
        route('child', { class: ChildRoute }, function () {
          route('grandchild', { class: GrandChildRoute }, function () {
            route('leaf', { class: LeafRoute })
          })
        })
      })
      route('root', { class: RootRoute })
    }
    router.map(routes)
    router.listen()
  })

  afterEach(() => {
    router.destroy()
  })

  describe('request', () => {
    it('should be replied by a parent route', function (done) {
      let contextValue
      let spy = sinon.spy(function () {
        return 'The Context'
      })
      GrandChildRoute.prototype.contextRequests = {
        value: spy
      }
      sinon.stub(LeafRoute.prototype, 'activate').callsFake(function (transition) {
        contextValue = this.getContext().request('value', 'a', 5)
      })
      router.transitionTo('leaf').then(function () {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledWith('a', 5)
        expect(contextValue).to.be.equal('The Context')
        done()
      }).catch(done)
    })

    it('should work outside of transition lifecycle', function (done) {
      let leafRoute
      GrandChildRoute.prototype.contextRequests = {
        value: function () {
          return 'The Context'
        }
      }
      sinon.stub(LeafRoute.prototype, 'activate').callsFake(function () {
        leafRoute = this
      })
      router.transitionTo('leaf').then(function () {
        let contextValue = leafRoute.getContext().request('value')
        expect(router.state.activeTransition).to.be.equal(null)
        expect(contextValue).to.be.equal('The Context')
        done()
      }).catch(done)
    })

    it('should not be replied by a child route', function (done) {
      let contextValue = 'Original Value'
      GrandChildRoute.prototype.contextRequests = {
        value: function () {
          return 'The Context'
        }
      }
      sinon.stub(ChildRoute.prototype, 'activate').callsFake(function (transition) {
        contextValue = this.getContext().request('value')
      })
      router.transitionTo('leaf').then(function () {
        expect(contextValue).to.be.equal(undefined)
        done()
      }).catch(done)
    })

    it('should be replied by the nearest parent route', function (done) {
      let contextValue

      ParentRoute.prototype.contextRequests = {
        value: function () {
          return 'Parent Context'
        }
      }

      GrandChildRoute.prototype.contextRequests = {
        value: function () {
          return 'Grand Child Context'
        }
      }
      sinon.stub(LeafRoute.prototype, 'activate').callsFake(function (transition) {
        contextValue = this.getContext().request('value')
      })
      router.transitionTo('leaf').then(function () {
        expect(contextValue).to.be.equal('Grand Child Context')
        done()
      }).catch(done)
    })

    it('should return undefined if no reply is defined in a parent route', function (done) {
      let contextValue = 'Original value'
      GrandChildRoute.prototype.contextRequests = {
        value: function () {
          return 'The Context'
        }
      }
      sinon.stub(LeafRoute.prototype, 'activate').callsFake(function (transition) {
        contextValue = this.getContext().request('othervalue')
      })
      router.transitionTo('leaf').then(function () {
        expect(contextValue).to.be.equal(undefined)
        done()
      }).catch(done)
    })
  })

  describe('trigger', () => {
    it('should be captured by a parent route', function (done) {
      let spy = sinon.spy()
      GrandChildRoute.prototype.contextEvents = {
        'my:event': spy
      }
      sinon.stub(LeafRoute.prototype, 'activate').callsFake(function (transition) {
        this.getContext().trigger('my:event', 'a', 5)
      })
      router.transitionTo('leaf').then(function () {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledWith('a', 5)
        done()
      }).catch(done)
    })

    it('should work outside of transition lifecycle', function (done) {
      let spy = sinon.spy()
      let leafRoute
      GrandChildRoute.prototype.contextEvents = {
        'my:event': spy
      }
      sinon.stub(LeafRoute.prototype, 'activate').callsFake(function () {
        leafRoute = this
      })
      router.transitionTo('leaf').then(function () {
        leafRoute.getContext().trigger('my:event')
        expect(router.state.activeTransition).to.be.equal(null)
        expect(spy).to.be.calledOnce
        done()
      }).catch(done)
    })

    it('should not be captured by a child route', function (done) {
      let spy = sinon.spy()
      GrandChildRoute.prototype.contextEvents = {
        'my:event': spy
      }
      sinon.stub(ChildRoute.prototype, 'activate').callsFake(function (transition) {
        this.getContext().trigger('my:event')
      })
      router.transitionTo('leaf').then(function () {
        expect(spy).to.not.be.called
        done()
      }).catch(done)
    })
  })
})
