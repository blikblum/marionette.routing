/* eslint-disable no-unused-expressions */
/* global describe,beforeEach,afterEach,it */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { Route, Router } from '../src/index'
import Radio from 'backbone.radio'
import * as Mn from 'backbone.marionette'
import _ from 'underscore'
import $ from 'jquery'

let expect = chai.expect
chai.use(sinonChai)

let router, routes
let RootRoute, ParentRoute, ChildRoute, LeafRoute

let ParentView = Mn.View.extend({
  template: function () {
    return '<div class="child-view"></div>'
  },
  regions: {
    outlet: '.child-view'
  }
})

let GrandChildView = Mn.View.extend({
  tagName: 'h2',
  template: function () {
    return 'GrandChild'
  }
})

let LeafView = Mn.View.extend({
  template: function () {
    return 'Leaf'
  }
})

let LeafCollectionView = Mn.CollectionView.extend({
  template: function () {
    return 'Collection'
  }
})

describe('rootRegion', () => {
  afterEach(() => {
    router.destroy()
  })

  it('can be defined as a Region instance', () => {
    const region = new Mn.Region({ el: '#main' })
    router = new Router({}, region)
    expect(router.rootRegion).to.be.equal(region)
  })

  it('can be defined as a HTML element', () => {
    const el = document.getElementById('main')
    router = new Router({}, el)
    expect(router.rootRegion).to.be.instanceOf(Mn.Region)
    expect(router.rootRegion.$el[0]).to.be.equal(el)
  })

  it('can be defined as a CSS selector', () => {
    router = new Router({}, '#main')
    expect(router.rootRegion).to.be.instanceOf(Mn.Region)
    expect(router.rootRegion.$el[0]).to.be.equal(document.getElementById('main'))
  })
})

describe('Render', () => {
  beforeEach(() => {
    router = new Router({ location: 'memory' }, '#main')
    ParentRoute = Route.extend({
      viewClass: ParentView
    })
    RootRoute = Route.extend({})
    ChildRoute = Route.extend({})
    LeafRoute = Route.extend({})
    routes = function (route) {
      route('parent', { routeClass: ParentRoute }, function () {
        route('child', { routeClass: ChildRoute }, function () {
          route('grandchild', { viewClass: GrandChildView }, function () {
            route('leaf', { routeClass: LeafRoute, viewClass: LeafView })
          })
        })
      })
      route('root', { routeClass: RootRoute, routeOptions: { viewClass: ParentView } })
      route('root2', { viewClass: ParentView, outlet: false }, function () {
        route('leaf2', { routeClass: LeafRoute, viewClass: LeafView })
      })
      route('root3', { routeClass: RootRoute })
      route('collection', { viewClass: LeafCollectionView })
    }
    router.map(routes)
    router.listen()

    document.body.innerHTML = '<div id="main">Test</div>'
  })

  afterEach(() => {
    router.destroy()
  })

  describe('viewClass', function () {
    it('can be defined in the Route class', function (done) {
      router.transitionTo('parent').then(function () {
        expect($('#main').html()).to.be.equal('<div><div class="child-view"></div></div>')
        done()
      }).catch(done)
    })

    it('can be defined in the Route class as a function', function (done) {
      let routeInstance
      sinon.stub(ParentRoute.prototype, 'initialize').callsFake(function () {
        routeInstance = this
      })
      let viewClassSpy = sinon.spy(function () {
        return ParentView
      })
      ParentRoute.prototype.viewClass = viewClassSpy
      router.transitionTo('parent').then(function () {
        expect($('#main').html()).to.be.equal('<div><div class="child-view"></div></div>')
        expect(viewClassSpy).to.be.calledOnce
        expect(viewClassSpy).to.be.calledOn(routeInstance)
        done()
      }).catch(done)
    })

    it('can be passed through routeOptions.viewClass', function (done) {
      router.transitionTo('root').then(function () {
        expect($('#main').html()).to.be.equal('<div><div class="child-view"></div></div>')
        done()
      }).catch(done)
    })

    it('can be passed through viewClass, without a routeClass', function (done) {
      router.transitionTo('root2').then(function () {
        expect($('#main').html()).to.be.equal('<div><div class="child-view"></div></div>')
        done()
      }).catch(done)
    })

    describe('of a root route', function () {
      it('should be rendered in rootRegion', function (done) {
        router.transitionTo('parent').then(function () {
          expect($('#main').html()).to.be.equal('<div><div class="child-view"></div></div>')
          done()
        }).catch(done)
      })

      it('should abort transition when no rootRegion is defined', function (done) {
        router.rootRegion = null
        router.transitionTo('parent').then(function () {
          done('transition resolved')
        }).catch(function (error) {
          expect(error).to.be.an('error')
          expect(error.message).to.be.equal('No root outlet region defined')
          done()
        })
      })

      it('should not abort transition when no rootRegion is defined and view is prerendered', function () {
        router.rootRegion = null
        RootRoute.prototype.viewClass = Mn.View.extend({ el: '#main' })
        return router.transitionTo('root3').then(function () {
          expect(router.isActive('root3'))
        })
      })
    })

    describe('of a child route', function () {
      it('should be rendered in the outlet region of the nearest route with a view', function (done) {
        router.transitionTo('grandchild').then(function () {
          expect($('#main').html()).to.be.equal('<div><div class="child-view"><h2>GrandChild</h2></div></div>')
          done()
        }).catch(done)
      })

      it('should abort transition if no outlet region is defined in the nearest route with a view', function (done) {
        router.transitionTo('leaf').then(function () {
          done('transition resolved')
        }).catch(function (error) {
          expect(error).to.be.an('error')
          expect(error.message).to.be.equal('No outlet region defined in grandchild route')
          done()
        })
      })

      it('should look for outlet region in the parent routes when route with a view has option outlet = false', function () {
        return router.transitionTo('root2').then(function () {
          // force root2 render view before going to leaf2
          return router.transitionTo('leaf2')
        }).then(function () {
          expect($('#main').html()).to.be.equal('<div>Leaf</div>')
        })
      })
    })

    describe('of a target route', function () {
      it('should be rendered even if already activated', function () {
        let spy = sinon.spy(ParentView.prototype, 'render')
        return router.transitionTo('grandchild').then(function () {
          return router.transitionTo('parent')
        }).then(function () {
          expect(spy).to.be.calledTwice
          expect($('#main').html()).to.be.equal('<div><div class="child-view"></div></div>')
        })
      })
    })

    describe('for a CollectionView', function () {
      it('can load successfully', function (done) {
        router.transitionTo('collection').then(function () {
          expect($('#main').html()).to.be.equal('<div>Collection</div>')
          done()
        }).catch(done)
      })
    })
  })

  describe('viewEvents', function () {
    let spy1, spy2
    beforeEach(() => {
      spy1 = sinon.spy()
      spy2 = sinon.spy()
      RootRoute.prototype.viewEvents = {
        'my:event': spy1,
        'other:event': spy2
      }
    })

    it('will listen to view events and call registered handlers', function (done) {
      router.transitionTo('root').then(function () {
        router.rootRegion.currentView.trigger('my:event')
        expect(spy1).to.be.calledOnce
        expect(spy2).to.not.be.called
        done()
      }).catch(done)
    })

    it('will stop listening to view events when deactivated', function (done) {
      let rootView
      router.transitionTo('root').then(function () {
        rootView = router.rootRegion.currentView
        return router.transitionTo('parent')
      }).then(function () {
        rootView.trigger('my:event')
        expect(spy1).to.not.be.called
        expect(spy2).to.not.be.called
        done()
      }).catch(done)
    })
  })

  describe('renderView', function () {
    it('should be called with region and transition objects', function () {
      let spy = sinon.spy(ParentRoute.prototype, 'renderView')
      let transition = router.transitionTo('parent')
      return transition.then(function () {
        expect(spy).to.be.calledOnce.and.calledWith(router.rootRegion, transition)
      })
    })

    it('should be called after activate is resolved', function () {
      let spy = sinon.spy(ParentRoute.prototype, 'renderView')
      let activateSpy = sinon.spy()
      ParentRoute.prototype.activate = function () {
        return new Promise(function (resolve) {
          setTimeout(resolve, 100)
        })
      }
      Radio.channel('router').on('activate', activateSpy)

      return router.transitionTo('parent').then(function () {
        expect(spy).to.be.calledAfter(activateSpy)
      })
    })

    it('should be not be called when transition is cancelled', function (done) {
      let spy = sinon.spy(ParentRoute.prototype, 'renderView')
      ParentRoute.prototype.activate = function (transition) {
        transition.cancel()
      }

      router.transitionTo('parent').catch(function () {
        _.defer(function () {
          expect(spy).to.not.be.called
          done()
        })
      })
    })
  })

  describe('updateView', function () {
    it('should be called only if route has a rendered view', function () {
      let spy = sinon.spy(ParentRoute.prototype, 'updateView')
      let transition
      return router.transitionTo('parent').then(function () {
        expect(spy).not.to.be.called
        // force a new render
        transition = router.transitionTo('parent', {}, { id: 1 })
        return transition
      }).then(function () {
        expect(spy).to.be.calledOnce.and.calledWith(transition)
      })
    })

    it('should prevent view re render if returns truthy', function () {
      let routeInstance, savedView
      sinon.stub(ParentRoute.prototype, 'initialize').callsFake(function () {
        routeInstance = this
      })

      ParentRoute.prototype.updateView = function () {
        return true
      }

      return router.transitionTo('parent').then(function () {
        savedView = routeInstance.view
        // force a new render
        return router.transitionTo('parent', {}, { id: 1 })
      }).then(function () {
        expect(savedView).to.be.equal(routeInstance.view)
      })
    })
  })

  describe('view', function () {
    it('should be set to undefined after is destroyed', function () {
      let routeInstance
      sinon.stub(ParentRoute.prototype, 'initialize').callsFake(function () {
        routeInstance = this
      })

      return router.transitionTo('parent').then(function () {
        return router.transitionTo('root')
      }).then(function () {
        expect(routeInstance.view).to.not.exist
      })
    })

    it('should not be set to undefined after rendering the same route', function () {
      let routeInstance
      sinon.stub(ParentRoute.prototype, 'initialize').callsFake(function () {
        routeInstance = this
      })

      return router.transitionTo('parent').then(function () {
        return router.transitionTo('parent', {}, { page: 1 })
      }).then(function () {
        expect(routeInstance.view).to.exist
      })
    })
  })
})
