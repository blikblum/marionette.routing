import chai from 'chai';
import jsdom from 'mocha-jsdom';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Route, RouterLink, createRouter, destroyRouter, middleware} from '../src/index';
import Mn from 'backbone.marionette';
import Backbone from 'backbone';

let expect = chai.expect;
chai.use(sinonChai);


let router, routes;
let RootRoute, ParentRoute, ChildRoute, GrandChildRoute, LeafRoute;

let ParentView = Mn.View.extend({
  behaviors: [RouterLink],
  template: function () {
    return `<div id="div-rootlink1" route="root" param-id="1"></div>
      <div id="div-grandchildlink" route="grandchild"></div>
      <div id="div-parentlink" route="parent"><div id="innerparent"></div> </div>
      <a id="a-rootlink2" route="root" param-id="2"></a>
      <a id="a-parentlink" route="parent"></a>
      <a id="a-grandchildlink" route="grandchild"></a>
      <div id="div-a-parent" route="parent"><a id="childanchor"></a><a id="childanchor2"></a></div>
      <div class="child-view"></div>
     `
  },
  regions: {
    outlet: '.child-view'
  }
});

let GrandChildView = Mn.View.extend({
  tagName: 'h2',
  template: function () {
    return 'GrandChild'
  }
});

describe('RouterLink', () => {

  let $;
  jsdom();

  before(function () {
    Backbone.$ = $ = require('jquery')(window)
  });

  beforeEach(() => {
    router = createRouter();
    router.use(middleware);
    ParentRoute = Route.extend({
      viewClass: ParentView
    });
    RootRoute = Route.extend({}), ChildRoute = Route.extend({}),
      GrandChildRoute = Route.extend({}), LeafRoute = Route.extend({});
    routes = function (route) {
      route('parent', {routeClass: ParentRoute}, function () {
        route('child', {routeClass: ChildRoute}, function () {
          route('grandchild', {viewClass: GrandChildView})
        })
      });
      route('root', {path: 'root/:id', routeClass: RootRoute, routeOptions: {viewClass: ParentView}});
    };
    router.map(routes);

    document.body.innerHTML = '<div id="main"></div>';
    let RootRegion = Mn.Region.extend({
      el: '#main'
    });
    router.rootRegion = new RootRegion()

    router.listen();
  });

  afterEach(() => {
    destroyRouter(router);
    document.location.path = ''
  });

  it('should generate href attributes in anchor tags with route attribute', function () {
    return router.transitionTo('parent').then(function () {
      expect($('#a-parentlink').attr('href')).to.be.equal('#parent')
      expect($('#a-rootlink2').attr('href')).to.be.equal('#root/2')
      expect($('#a-grandchildlink').attr('href')).to.be.equal('#parent/child/grandchild')
    })
  })

  it('should generate href attributes in first child anchor of a element with route attribute', function () {
    return router.transitionTo('parent').then(function () {
      expect($('#childanchor').attr('href')).to.be.equal('#parent')
      expect($('#childanchor2').attr('href')).to.be.equal(undefined)
    })
  })

  it('should call transitionTo when a non anchor tags with route attribute is clicked', function () {
    return router.transitionTo('parent').then(function () {
      let spy = sinon.spy(router, 'transitionTo')
      $('#div-rootlink1').click()
      expect(spy).to.be.calledOnce.and.calledWith('root', {'id': '1'})

      spy.reset()
      $('#div-grandchildlink').click()
      expect(spy).to.be.calledOnce.and.calledWith('grandchild')

      spy.reset()
      $('#innerparent').click()
      expect(spy).to.be.calledOnce.and.calledWith('parent')
    })
  })

  it('should not call transitionTo when a non anchor tags with route attribute with an anchor descendant is clicked', function () {
    return router.transitionTo('parent').then(function () {
      let spy = sinon.spy(router, 'transitionTo')
      $('#div-a-parent').click()
      expect(spy).not.to.be.called
    })
  })

  it('should set active class in tag with route attribute when respective route is active', function () {
    return router.transitionTo('parent').then(function () {
      //this handler will be called before middleware one. PostPone actual test
      return Promise.resolve()
    }).then(function () {
      expect($('#a-parentlink').hasClass('active')).to.be.true
      expect($('#div-parentlink').hasClass('active')).to.be.true
      expect($('#a-rootlink2').hasClass('active')).to.be.false
      expect($('#div-rootlink1').hasClass('active')).to.be.false
      expect($('#a-grandchildlink').hasClass('active')).to.be.false
      expect($('#div-grandchildlink').hasClass('active')).to.be.false
      return router.transitionTo('root', {id: '1'})
    }).then(function () {
      expect($('#a-parentlink').hasClass('active')).to.be.false
      expect($('#div-parentlink').hasClass('active')).to.be.false
      expect($('#a-rootlink2').hasClass('active')).to.be.false
      expect($('#div-rootlink1').hasClass('active')).to.be.true
      expect($('#a-grandchildlink').hasClass('active')).to.be.false
      expect($('#div-grandchildlink').hasClass('active')).to.be.false
      return router.transitionTo('grandchild')
    }).then(function () {
      expect($('#a-parentlink').hasClass('active')).to.be.true
      expect($('#div-parentlink').hasClass('active')).to.be.true
      expect($('#a-rootlink2').hasClass('active')).to.be.false
      expect($('#div-rootlink1').hasClass('active')).to.be.false
      expect($('#a-grandchildlink').hasClass('active')).to.be.true
      expect($('#div-grandchildlink').hasClass('active')).to.be.true
    })
  })
});

