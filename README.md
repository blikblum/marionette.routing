# Marionette Routing

[![NPM version](http://img.shields.io/npm/v/marionette.routing.svg?style=flat-square)](https://www.npmjs.com/package/marionette.routing)
[![NPM downloads](http://img.shields.io/npm/dm/marionette.routing.svg?style=flat-square)](https://www.npmjs.com/package/marionette.routing)
[![Build Status](http://img.shields.io/travis/blikblum/marionette.routing.svg?style=flat-square)](https://travis-ci.org/blikblum/marionette.routing)
[![Coverage Status](https://img.shields.io/coveralls/blikblum/marionette.routing.svg?style=flat-square)](https://coveralls.io/github/blikblum/marionette.routing)
[![Dependency Status](http://img.shields.io/david/dev/blikblum/marionette.routing.svg?style=flat-square)](https://david-dm.org/blikblum/marionette.routing#info=devDependencies)

> An advanced router for MarionetteJS applications

### Features

&nbsp; &nbsp; ✓ Nested routes / states / rendering<br>
&nbsp; &nbsp; ✓ Handle asynchronous operations<br>
&nbsp; &nbsp; ✓ Lazy loading of routes with code splitting<br>
&nbsp; &nbsp; ✓ Expose route events through [Radio](https://github.com/marionettejs/backbone.radio)<br>
&nbsp; &nbsp; ✓ Implement route context for scoped messaging<br>
&nbsp; &nbsp; ✓ API interface semantics similar to MarionetteJS one<br>
&nbsp; &nbsp; ✓ Inherits most of [Cherrytree](https://github.com/QubitProducts/cherrytree) features<br>


### Installation

    $ npm install --save marionette.routing

Requires MarionetteJS v4+, Radio v2+, underscore v1.8+ as peer dependencies

Requires a ES6 Promise implementation attached in window (native or polyfill)

### Usage

Define a Route class

```js
import {Route} from 'marionette.routing';
import {Contacts} from '../entities';
import ContactsView from './view';

export default Route.extend({
  activate(){
    const contactsPromise = Radio.channel('api').request('getContactList');
    return contactsPromise.then(contactsData => {
      this.contacts = new Contacts(contactsData)
    });
  },

  component: ContactsView,

  viewOptions() {
    return {
      contacts: this.contacts
    }
  }
})

```

Configure and start the router

```js
import { Router } from 'marionette.routing';
import ContactsRoute from './contacts/route';
import LoginView from './login/view';
import Mn from 'backbone.marionette';
import Radio from 'backbone.radio';

//create the router
let router = new Router({log: true, logError: true});

//define the routes
router.map(function (route) {
  route('application', {path: '/', abstract: true}, function () {
    route('contacts', {class: ContactsRoute})
    route('login', {component: LoginView})
  })
});

//define a root region
router.rootRegion = new Mn.Region({el: '#app'});

//start listening to URL changes
router.listen();

//listen to events using Radio
Radio.channel('router').on('before:activate', function(transition, route) {
  let isAuthenticate = checkAuth();
  if (!isAuthenticate && route.requiresAuth) {
    transition.redirectTo('login');
  }
})
```

### Documentation

* API
  * [Router Configuration](docs/configuration.md)
  * [Route Class](docs/route.md)
  * [Events](docs/events.md)
  * [RouterLink](docs/routerlink.md)
* Guides
  * [Route lazy loading](docs/lazyload.md)
  * [Managing authorization](docs/authorization.md)
  * [Handling errors](docs/errors.md)

### Examples

 * [Contact Manager](https://github.com/blikblum/marionette-contact-manager) Fully functional example. Read the [tutorial](http://jsroad.blogspot.com.br/2016/11/tutorial-contact-manager-application.html)
 * [Marionette Wires Revisited](https://github.com/blikblum/marionette-wires-revisited)

### Related Projects

* [Cherrytree](https://github.com/QubitProducts/cherrytree) — The router library used by Marionette Routing under the hood 
* [Babel Starter Kit](https://github.com/kriasoft/babel-starter-kit) — Template used to bootstrap this project


### License

Copyright © 2016 Luiz Américo Pereira Câmara. This source code is licensed under the MIT license found in
the [LICENSE.txt](https://github.com/blikblum/marionette.routing/blob/master/LICENSE.txt) file.
The documentation to the project is licensed under the [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/)
license.
