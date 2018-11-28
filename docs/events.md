# Events

In the lifecycle of a route transition, events are triggered in the
'router' Radio channel. The behavior of the transition can be altered 
by the event handlers
    
###<code>'before:transition' </code>
 
 Arguments: transition
 
 Emitted before a route transition starts
 
###<code>'transition' </code>
 
 Arguments: transition
 
 Emitted after a route transition finishes

###<code>'transition:error' </code>
 
 Arguments: transition, error
 
 Emitted when a transition fails 
  
###<code>'transition:abort' </code>
 
 Arguments: transition, error
 
 Emitted when a transition is aborted due to an error or cancelation

###<code>'before:activate' </code>
  
  Arguments: transition, route
  
  Emitted when a route is being activated
  
###<code>'activate' </code>
  
  Arguments: transition, route
  
  Emitted after a route is activated
   
   
###<code>'before:deactivate' </code>
  
  Arguments: transition, route
  
  Emitted when a route is being deactivated
  
###<code>'deactivate' </code>
  
  Arguments: transition, route
  
  Emitted after a route is deactivated   
