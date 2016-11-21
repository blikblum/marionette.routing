# Route Class

  The base class for defining routes. Extends from Marionette.Object
  
## Methods
  
### <code>activate(transition) [-> Promise]</code>
 
 Called when route is about to be activated
 
 The transition argument provides information about the routes being 
 transitioned to and methods to manipulate the transition like
 cancel and redirectTo
 
 If a Promise is returned, the route activation is complete only after
 the Promise resolution

### <code>deactivate(transition)</code>

 Called when route is about to be deactivated

 The transition argument provides information about the routes being 
 transitioned to and methods to manipulate the transition like
 cancel and redirectTo

### <code>getContext</code>
 
 Returns a route context object. 
 
 The context object provides two methods: trigger and requests both with 
 the same semantics as the used in Radio. The events and requests will be handled
 by one of the parent routes through contextEvents and contextRequests 
   
## Properties    

### <code>viewClass</code>
 
 Defines the Marionette.View that will be rendered when the route is activated
 
### <code>viewOptions</code>
  
 Defines the options to be passed in the Marionette.View constructor
 
### <code>viewEvents</code>
   
 A hash defining listeners for the events triggered by the view
 
### <code>contextRequests</code>
    
 A hash defining reply functions to requests done by child routes through getContext
 
### <code>contextEvents</code>
    
 A hash defining listeners to events triggered by child routes through getContext 