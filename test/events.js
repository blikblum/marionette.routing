/* eslint-disable no-unused-expressions */
/* global describe,beforeEach,afterEach,it */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import _ from 'underscore'
import { Radio } from 'nextbone-radio'
import { Route, Router } from '../src/index'

let expect = chai.expect
let assert = chai.assert
chai.use(sinonChai)

let router, routes
let RootRoute, ParentRoute, ChildRoute, GrandChildRoute, LeafRoute
let currentTransition

describe('Events', () => {
  beforeEach(() => {
    router = new Router({ location: 'memory' })
    router.use(function (transition) {
      currentTransition = transition
    }, { before: true })
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
    Radio.channel('router').off()
    router.destroy()
  })

  describe('before:transition', () => {
    it('should be called with transition as argument', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('before:transition', function (transition) {
        spy()
        expect(transition).to.be.equal(currentTransition)
      })
      router.transitionTo('root').then(function () {
        expect(spy).to.be.calledOnce
        done()
      }).catch(done)
    })

    it('should be triggered before a transition', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('before:transition', spy)
      let rootSpy = sinon.spy(RootRoute.prototype, 'initialize')
      router.transitionTo('root').then(function () {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledBefore(rootSpy)
        done()
      }).catch(done)
    })

    it('should allow to cancel the transition', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('before:transition', function (transition) {
        spy()
        transition.cancel()
      })
      let rootSpy = sinon.spy(RootRoute.prototype, 'initialize')
      router.transitionTo('root').then(function () {
        assert.fail('resolve transition should not be called')
        done()
      }).catch(function () {
        expect(spy).to.be.calledOnce
        expect(rootSpy).to.not.be.called
        done()
      })
    })
  })

  describe('transition', () => {
    it('should be called with transition as argument', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('transition', function (transition) {
        spy()
        expect(transition).to.be.equal(currentTransition)
      })
      router.transitionTo('root').then(function () {
        Promise.resolve().then(function () {
          expect(spy).to.be.calledOnce
          done()
        })
      }).catch(done)
    })

    it('should be triggered after a transition is resolved', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('transition', function () {
        expect(router.state.activeTransition).to.be.equal(null)
        spy()
      })
      let leafSpy = sinon.spy(LeafRoute.prototype, 'activate')
      router.transitionTo('leaf').then(function () {
        Promise.resolve().then(function () {
          expect(spy).to.be.calledOnce
          expect(spy).to.be.calledAfter(leafSpy)
          done()
        })
      }).catch(done)
    })
  })

  describe('transition:error', () => {
    it('should be called when an error occurs in middle of transaction', function () {
      let spy = sinon.spy()

      Radio.channel('router').on('transition:error', spy)

      RootRoute.prototype.activate = function () {
        throw new Error('xx')
      }

      return router.transitionTo('root').catch(function () {
        return Promise.resolve().then(function () {
          expect(spy).to.be.calledOnce
        })
      })
    })

    it('should be called with transition and error as arguments', function (done) {
      Radio.channel('router').on('transition:error', function (transition, e) {
        expect(transition).to.be.equal(currentTransition)
        expect(e).to.be.a('error')
        done()
      })

      RootRoute.prototype.activate = function () {
        throw new Error('xx')
      }

      router.transitionTo('root')
    })

    it('should not be called when transaction is redirected', function () {
      let spy = sinon.spy()

      Radio.channel('router').on('transition:error', spy)

      RootRoute.prototype.activate = function (transition) {
        transition.redirectTo('parent')
      }

      return router.transitionTo('root').catch(function () {
        return Promise.resolve().then(function () {
          expect(spy).to.not.be.called
        })
      })
    })

    it('should not be called when transaction is cancelled', function () {
      let spy = sinon.spy()

      Radio.channel('router').on('transition:error', spy)

      RootRoute.prototype.activate = function (transition) {
        transition.cancel()
      }

      return router.transitionTo('root').catch(function () {
        return Promise.resolve().then(function () {
          expect(spy).to.not.be.called
        })
      })
    })
  })

  describe('transition:abort', () => {
    it('should be called when an error occurs in middle of transaction', function () {
      let spy = sinon.spy()

      Radio.channel('router').on('transition:abort', spy)

      RootRoute.prototype.activate = function () {
        throw new Error('xx')
      }

      return router.transitionTo('root').catch(function () {
        return Promise.resolve().then(function () {
          expect(spy).to.be.calledOnce
        })
      })
    })

    it('should be called with transition and error as arguments', function (done) {
      Radio.channel('router').on('transition:abort', function (transition, e) {
        expect(transition).to.be.equal(currentTransition)
        expect(e).to.be.a('error')
        done()
      })

      RootRoute.prototype.activate = function () {
        throw new Error('xx')
      }

      router.transitionTo('root')
    })

    it('should not be called when transaction is redirected', function () {
      let spy = sinon.spy()

      Radio.channel('router').on('transition:abort', spy)

      RootRoute.prototype.activate = function (transition) {
        transition.redirectTo('parent')
      }

      return router.transitionTo('root').catch(function () {
        return Promise.resolve().then(function () {
          expect(spy).to.not.be.called
        })
      })
    })

    it('should be called when transaction is cancelled', function () {
      let spy = sinon.spy()

      Radio.channel('router').on('transition:abort', spy)

      RootRoute.prototype.activate = function (transition) {
        transition.cancel()
      }

      return router.transitionTo('root').catch(function () {
        return Promise.resolve().then(function () {
          expect(spy).to.be.called
        })
      })
    })
  })

  describe('before:activate', () => {
    it('should be called with transition and route as arguments', function () {
      let spy = sinon.spy()
      Radio.channel('router').on('before:activate', function (transition, route) {
        spy()
        expect(transition).to.be.equal(currentTransition)
        expect(route).to.be.instanceof(RootRoute)
      })
      return router.transitionTo('root').then(function () {
        expect(spy).to.be.calledOnce
      })
    })

    it('should be triggered before activate of same route', function () {
      let spy = sinon.spy()
      Radio.channel('router').on('before:activate', spy)
      let rootSpy = sinon.spy(RootRoute.prototype, 'activate')
      return router.transitionTo('root').then(function () {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledBefore(rootSpy)
      })
    })

    it('should be triggered before activate of parent route', function () {
      let spy = sinon.spy()
      Radio.channel('router').on('before:activate', function (transition, route) {
        if (route instanceof GrandChildRoute) {
          spy()
        }
      })
      let parentSpy = sinon.spy(ParentRoute.prototype, 'activate')
      return router.transitionTo('grandchild').then(function () {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledBefore(parentSpy)
      })
    })

    it('should allow to cancel the transition', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('before:activate', function (transition) {
        spy()
        transition.cancel()
      })
      let rootSpy = sinon.spy(RootRoute.prototype, 'activate')
      router.transitionTo('root').then(function () {
        assert.fail('resolve transition should not be called')
        done()
      }).catch(function () {
        expect(spy).to.be.calledOnce
        expect(rootSpy).to.not.be.called
        done()
      })
    })
  })

  describe('activate', () => {
    it('should be called with transition and route as arguments', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('activate', function (transition, route) {
        spy()
        expect(transition).to.be.equal(currentTransition)
        expect(route).to.be.instanceof(RootRoute)
      })
      router.transitionTo('root').then(function () {
        expect(spy).to.be.calledOnce
        done()
      }).catch(done)
    })

    it('should be triggered after activate method is resolved', function (done) {
      let spy = sinon.spy()
      let promiseSpy = sinon.spy()
      Radio.channel('router').on('activate', spy)
      let rootSpy = sinon.stub(RootRoute.prototype, 'activate').callsFake(function () {
        return new Promise((resolve) => setTimeout(resolve, 100)).then(promiseSpy)
      })
      router.transitionTo('root').then(function () {
        expect(spy).to.be.calledOnce
        expect(promiseSpy).to.be.calledOnce
        expect(spy).to.be.calledAfter(rootSpy)
        expect(spy).to.be.calledAfter(promiseSpy)
        done()
      }).catch(done)
    })

    it('should not be triggered when transition is cancelled in activate method', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('activate', spy)
      sinon.stub(RootRoute.prototype, 'activate').callsFake(function (transition) {
        transition.cancel()
      })
      router.transitionTo('root').catch(function () {
        _.defer(function () {
          expect(spy).to.not.be.called
          done()
        })
      })
    })

    it('should allow to cancel the transition', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('activate', function (transition, route) {
        spy()
        if (route instanceof GrandChildRoute) {
          transition.cancel()
        }
      })
      let leafSpy = sinon.spy(LeafRoute.prototype, 'activate')
      router.transitionTo('leaf').then(function () {
        assert.fail('resolve transition should not be called')
        done()
      }).catch(function () {
        expect(spy).to.be.calledThrice
        expect(leafSpy).to.not.be.called
        done()
      })
    })
  })

  describe('before:deactivate', () => {
    it('should be called with transition and route as arguments', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('before:deactivate', function (transition, route) {
        spy()
        expect(transition).to.be.equal(currentTransition)
        expect(route).to.be.instanceof(RootRoute)
      })
      router.transitionTo('root').then(function () {
        return router.transitionTo('parent')
      }).then(function () {
        expect(spy).to.be.calledOnce
        done()
      }).catch(done)
    })

    it('should be triggered before deactivate of same route', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('before:deactivate', spy)
      let rootSpy = sinon.spy(RootRoute.prototype, 'deactivate')
      router.transitionTo('root').then(function () {
        return router.transitionTo('parent')
      }).then(function () {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledBefore(rootSpy)
        done()
      }).catch(done)
    })

    it('should be triggered before deactivate of child route', function () {
      let spy = sinon.spy()
      Radio.channel('router').on('before:deactivate', function (transition, route) {
        if (route instanceof ParentRoute) {
          spy()
        }
      })
      let childSpy = sinon.spy(GrandChildRoute.prototype, 'deactivate')
      return router.transitionTo('grandchild').then(function () {
        return router.transitionTo('root')
      }).then(function () {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledBefore(childSpy)
      })
    })

    it('should allow to cancel the transition', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('before:deactivate', function (transition) {
        spy()
        transition.cancel()
      })
      let rootSpy = sinon.spy(RootRoute.prototype, 'deactivate')
      router.transitionTo('root').then(function () {
        return router.transitionTo('parent')
      }).then(function () {
        assert.fail('resolve transition should not be called')
        done()
      }).catch(function () {
        expect(spy).to.be.calledOnce
        expect(rootSpy).to.not.be.called
        done()
      })
    })
  })

  describe('deactivate', () => {
    it('should be called with transition and route as arguments', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('deactivate', function (transition, route) {
        spy()
        expect(transition).to.be.equal(currentTransition)
        expect(route).to.be.instanceof(RootRoute)
      })
      router.transitionTo('root').then(function () {
        return router.transitionTo('parent')
      }).then(function () {
        expect(spy).to.be.calledOnce
        done()
      }).catch(done)
    })

    it('should be triggered after deactivate method is resolved', function (done) {
      const spy = sinon.spy()
      const promiseSpy = sinon.spy()
      Radio.channel('router').on('deactivate', spy)
      let rootSpy = sinon.stub(RootRoute.prototype, 'deactivate').callsFake(function () {
        return new Promise((resolve) => setTimeout(resolve, 100)).then(promiseSpy)
      })
      router.transitionTo('root').then(function () {
        return router.transitionTo('parent')
      }).then(function () {
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledAfter(rootSpy)
        expect(spy).to.be.calledAfter(promiseSpy)
        done()
      }).catch(done)
    })

    it('should allow to cancel the transition', function (done) {
      let spy = sinon.spy()
      Radio.channel('router').on('deactivate', function (transition, route) {
        spy()
        transition.cancel()
      })
      let parentSpy = sinon.spy(ParentRoute.prototype, 'activate')
      router.transitionTo('root').then(function () {
        return router.transitionTo('parent')
      }).then(function () {
        assert.fail('resolve transition should not be called')
        done()
      }).catch(function () {
        expect(spy).to.be.calledOnce
        expect(parentSpy).to.not.be.called
        done()
      })
    })
  })
})
