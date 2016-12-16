# RouterLink

A Marionette Behavior to automatically setup route links. It sets href for anchor elements and 
a click event for non anchor elements according to the <code>route</code> and <code>param-*</code> attributes.
It also monitors the router transitions, setting 'active' class when the respective route is active  
    
## Usage
 
View
```javascript
import {RouterLink} from 'marionette.routing';
import {View} from 'backbone.marionette';

export default View.extend({
  behaviors: [RouterLink]
});
```

Template
```html
<div class="nav">
  <a route="contacts">All contacts</a>
  <a route="contact" param-contactid="1">First Contact</a>
  <div route="about">About</div>  
</div>
```
 
