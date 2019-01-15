/* eslint-disable no-unused-expressions */
/* global describe,beforeEach,afterEach,it */

import chai from 'chai'
import sinonChai from 'sinon-chai'
import { Route, Router, Region } from '../src/index'
import { withEvents } from 'nextbone'
import $ from 'jquery'
import _ from 'underscore'
import { defineCE } from '@open-wc/testing-helpers'
import { LitElement, html } from 'lit-element'
import { Radio } from 'nextbone-radio'

let expect = chai.expect
chai.use(sinonChai)

let router, routes
let ParentRoute, ChildRoute, GrandchildRoute

class ParentView extends withEvents(LitElement) {
  createRenderRoot () {
    return this
  }

  render () {
    return html`<div class="child-el"></div>`
  }
}

const parentTag = defineCE(ParentView)

class ChildView extends LitElement {
  createRenderRoot () {
    return this
  }

  render () {
    return html`<h2>Child</h2><router-outlet></router-outlet>`
  }
}

const childTag = defineCE(ChildView)

class GrandChildView extends LitElement {
  createRenderRoot () {
    return this
  }

  render () {
    return html`Grandchild`
  }
}

const grandChildTag = defineCE(GrandChildView)

describe('Async Render', () => {
  beforeEach(() => {
    router = new Router({ location: 'memory' })
    ParentRoute = class extends Route {
      static get outletSelector () {
        return '.child-el'
      }
      component () { return ParentView }
    }
    ChildRoute = class extends Route {}
    GrandchildRoute = class extends Route {}
    routes = function (route) {
      route('parent', { class: ParentRoute }, function () {
        route('child', { class: ChildRoute, component: childTag }, function () {
          route('grandchild', { class: GrandchildRoute, component: GrandChildView })
        })
      })
    }
    router.map(routes)
    router.listen()

    document.body.innerHTML = '<div id="main"></div>'
    router.rootRegion = new Region(document.getElementById('main'))
  })

  afterEach(() => {
    router.destroy()
  })

  describe('when a nested route is activated', function () {
    let grandChildRenderCb

    beforeEach(() => {
      Radio.channel('router').on('route:render', route => {
        if (route.$config.name === 'grandchild' && grandChildRenderCb) {
          grandChildRenderCb(route)
        }
      })
    })

    afterEach(() => {
      Radio.channel('router').reset()
    })

    it('should render each route element in parent outlet', function (done) {
      grandChildRenderCb = async function (route) {
        await route.el.updateComplete
        const el = document.getElementById('main')
        expect(el.innerHTML).to.equal(`<${parentTag}><!----><div class="child-el"><${childTag}><!----><h2>Child</h2><router-outlet><${grandChildTag}><!---->Grandchild<!----></${grandChildTag}></router-outlet><!----></${childTag}></div><!----></${parentTag}>`)
        done()
      }
      router.transitionTo('grandchild')
    })
  })
})
