# RouterLink

A Marionette Behavior to automatically setup route links and monitor the router transitions. When the corresponding route
is active, the 'active' class will be added to the element  
    
## Usage

Configure a view to use RouterLink:
```javascript
import {RouterLink} from 'marionette.routing';
import {View} from 'backbone.marionette';

export default View.extend({
  behaviors: [RouterLink]
});
```

### Options

#### defaults

Returns default values to route `query` and `params` options

It should be defined as a hash, or a function returning a hash, where the key is the route name and the value is an object
with query and/or params options. The query and params options must be a hash, or a function returning a
hash. The functions are called with the view instance as context.


```javascript
import {RouterLink} from 'marionette.routing';
import {View} from 'backbone.marionette';

export default View.extend({
  behaviors: [{
    behaviorClass: RouterLink,
    defaults: {
      myroute: {
        query: {
          name: 'Luiz'
        },
        params() {
          return {
            role: this.personRole // this === view instance
          }
        }
      }
    }
  }]
});
```

### Attributes

The route link is configured with attributes in a HTML element

#### route

Defines the route be transitioned to. Should be the name of a route configured in the router map.
When the element is an anchor (<code>a</code>), its href will be expanded to the route path.

Adding a route attribute to a non anchor element will setup a click event handler that calls `router.transitionTo`
with the appropriate arguments. The exception is when the element has an anchor child. In this case the anchor href
will be expanded.
  
#### param-*  
  
Defines a param value where the param name is the substring after `param-` prefix

#### query-*  
  
Defines a query value where the query name is the substring after `query-` prefix

#### active-class

Defines the class to be toggled in the element with route attribute according to the route active state. By default is 'active'.
If is set to an empty string, no class is added
 
Examples:
```html
<div class="nav">
  
  <!-- a.href will be expanded to the contacts path -->
  <a route="contacts">All contacts</a>
  
  <!-- a.href will be expanded to the contacts path using {contactid: '1'} as params -->
  <a route="contact" param-contactid="1">First Contact</a>
  
  <!-- a click event handler will be added to the div, calling router.transitionTo('home') -->
  <div route="home">Home</div>
  
  <!-- a.href will be expanded to the about path. active class will be added to div. Useful for Bootstrao list-group -->
  <div route="about"><a>About</a></div>  
</div>
```