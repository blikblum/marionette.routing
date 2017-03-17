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

In the template, add an attribute named `route` to the element to be linked. The attribute value must be the name
of the route. Optionally pass route params adding `param-[paramname]` attributes

When the element is an anchor (<code>a</code>), its href will be expanded to the route path.

Adding a route attribute to a non anchor element will setup a click event handler that calls `router.transitionTo`
with the appropriate arguments. The exception is when the element has an anchor child. In this case the anchor href
will be expanded but the active class will be added to the element with route attribute.
 
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
  <div route="about"><a>About</a>></div>  
</div>
```