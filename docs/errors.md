# Handling errors

### Globally with `transition:error` event

Its good practice to add a handler for the `transition:error` event which is triggered for any error while routing

```js
import Radio from 'backbone.radio';

Radio.channel('router').on('transition:error', function(transition, error) {
  alert(`Error transitioning to ${transition.path}: ${error}`) 
  transition.redirectTo('errorrecovery')
})
```


### Per route with `activate` method

Its possible to control the transition (with `cancel` or `redirectTo` methods) in an Promise catch handler
or error event.   

With a promise
```javascript
import {Route} from 'marionette.routing';
import {loadDataAsync} from './my-data-service'

export default Route.extend({
  activate (transition) {
    //loadDataAsync() returns a promise
    return loadDataAsync()
     .catch((error) => {
        transition.redirectTo('dataerror', null, {error: error})
     }) 
  } 
});
```

In an error handler
```javascript
import {Route} from 'marionette.routing';
import {MyCollection} from './my-collection'

export default Route.extend({
  activate (transition) {
    this.collection = new MyCollection()
    return this.collection.fetch({
      error: (e) => {
        transition.redirectTo('dataerror', null, {error: e})
      }
    })    
  }
});
```

Sometimes is necessary to have a more granular error handling or do not cancel the transition when an error occurs
This is possible with Promises
 
```javascript
import {Route} from 'marionette.routing';
import {MyCollection} from './my-collection'

export default Route.extend({
  activate () {
    return new Promise((resolve) => {
      this.collection = new MyCollection()
      this.collection.fetch({
        success: resolve,
        error: () => {
          alert('Error fetching, continuing anyway')
          resolve()
        }
      })      
    })        
  }
});
```