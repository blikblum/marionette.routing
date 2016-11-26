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
    return `<div id="div-rootlink" route="root" param-id="1"></div>
      <div id="div-grandchildlink" route="grandchild"></div>
      <a id="a-rootlink" route="root" param-id="2"></a>
      <a id="a-parentlink" route="parent"></a>
      <a id="a-grandchildlink" route="grandchild"></a>
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
    router = createRouter({location: 'memory'});
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
  });

  it('should generate href attributes in anchor tags with route attribute', function () {
    return router.transitionTo('parent').then(function () {
      expect($('#a-parentlink').attr('href')).to.be.equal('/parent')
      expect($('#a-rootlink').attr('href')).to.be.equal('/root/2')
      expect($('#a-grandchildlink').attr('href')).to.be.equal('/parent/child/grandchild')
    })
  })

  it('should call transitionTo when a non anchor tags with route attribute is clicked', function () {
    return router.transitionTo('parent').then(function () {
      let spy = sinon.spy(router, 'transitionTo')
      $('#div-rootlink').click()
      expect(spy).to.be.calledOnce.and.calledWith('root', {'id': '1'})

      spy.reset()
      $('#div-grandchildlink').click()
      expect(spy).to.be.calledOnce.and.calledWith('grandchild')
    })
  })
});

