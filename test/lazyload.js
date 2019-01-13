/* eslint-disable no-unused-expressions */
/* global describe,beforeEach,afterEach,it */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { Route, Router } from '../src/index'

let expect = chai.expect
chai.use(sinonChai)

let router, routes
let ParentRoute, ChildRoute, GrandChildRoute, LeafRoute

function AsyncChildRoute () {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(ChildRoute)
    }, 200)
  })
}

describe('Route configuration', () => {
  beforeEach(() => {
    router = new Router({ location: 'memory' })
    ParentRoute = class extends Route {}
    ChildRoute = class extends Route {}
    GrandChildRoute = class extends Route {}
    LeafRoute = class extends Route {}

    routes = function (route) {
      route('parent', { class: ParentRoute, routeOptions: { x: 1 } }, function () {
        route('child', { class: ChildRoute }, function () {
          route('grandchild', {}, function () {
            route('leaf', {})
          })
        })
        route('child2', { class: AsyncChildRoute })
      })
    }
    router.map(routes)
    router.listen()
  })

  afterEach(() => {
    router.destroy()
  })

  describe('can be defined in a parent route class', function () {
    it('directly', function () {
      ChildRoute.prototype.childRoutes = function () {
        return {
          grandchild: GrandChildRoute,
          leaf: function () {
            return LeafRoute
          }
        }
      }
      let spy = sinon.spy(GrandChildRoute.prototype, 'initialize')
      let spy2 = sinon.spy(LeafRoute.prototype, 'initialize')
      return router.transitionTo('leaf').then(function () {
        expect(spy).to.be.calledOnce
        expect(spy2).to.be.calledOnce
      })
    })

    it('wrapped in an ES module', function () {
      const GrandChildModule = { __esModule: true, default: GrandChildRoute }
      const LeafModule = { __esModule: true, default: LeafRoute }
      ChildRoute.prototype.childRoutes = function () {
        return {
          grandchild: GrandChildModule,
          leaf: function () {
            return LeafModule
          }
        }
      }
      let spy = sinon.spy(GrandChildRoute.prototype, 'initialize')
      let spy2 = sinon.spy(LeafRoute.prototype, 'initialize')
      return router.transitionTo('leaf').then(function () {
        expect(spy).to.be.calledOnce
        expect(spy2).to.be.calledOnce
      })
    })
  })

  it('gives a meaningful error when not defined in a parent route class', function (done) {
    ChildRoute.prototype.childRoutes = function () {
      return {
        grandchild: GrandChildRoute
      }
    }
    router.transitionTo('leaf').then(function () {
      done('transition should fail')
    }).catch(function (err) {
      expect(err.message).to.be.equal('Unable to create route leaf: class or component must be defined')
      done()
    })
  })

  it('can be loaded asynchronously from childRoutes', function () {
    ChildRoute.prototype.childRoutes = function () {
      return {
        grandchild: GrandChildRoute,
        leaf: function () {
          return new Promise(function (resolve) {
            setTimeout(function () {
              resolve(LeafRoute)
            }, 200)
          })
        }
      }
    }
    let spy = sinon.spy(LeafRoute.prototype, 'initialize')
    return router.transitionTo('leaf').then(function () {
      expect(spy).to.be.calledOnce
    })
  })

  it('can be loaded asynchronously from class', function () {
    let spy = sinon.spy(ChildRoute.prototype, 'initialize')
    return router.transitionTo('child2').then(function () {
      expect(spy).to.be.calledOnce
    })
  })
})
