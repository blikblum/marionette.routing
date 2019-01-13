# Route Class

  The base class for defining routes. Extends from Marionette.Object

## Methods

### <code>activate(transition) [-> Promise]</code>

 Called when route is currently inactive and about to be activated

 The transition argument provides information about the routes being
 transitioned to and methods to manipulate the transition like
 cancel and redirectTo

 If a Promise is returned, the route activation is complete only after
 the Promise is resolved. If the returned Promise is rejected, the transition will be cancelled 
 and children routes `activate` methods will not be called
 
### <code>load(transition) [-> Promise]</code>

 Called in transition regardless of the route active state 

 The transition argument provides information about the routes being
 transitioned to and methods to manipulate the transition like
 cancel and redirectTo

 If a Promise is returned, the route loadind is complete only after the 
 Promise resolution, being resolved or rejected. The children routes `load` methods
 will always be called independent of return Promise state.

### <code>deactivate(transition)</code>

 Called when route is active and about to be deactivated

 The transition argument provides information about the routes being
 transitioned to and methods to manipulate the transition like
 cancel and redirectTo

### <code>getContext</code>

 Returns a route context object.

 The context object provides two methods: `trigger` and `requests` both with
 the same semantics as the used in Radio. The events and requests will be handled
 by one of the parent routes through
 [`contextEvents`](#contextEvents) and [`contextRequests`](#contextRequests).

```js
const NoteEditRoute = Route.extend({
  component: NoteEditView,

  viewOptions() {
    return {
      model: this.getContext().request('noteModel')
    };
  }
})
```

### <code>updateEl(transition)</code>

 Called when the view associated with the route is about to be re-rendered.

Allows to configure how a view already rendered will be updated. Returning
a truthy value will prevent the default behavior (render a new view)

## Properties

### <code>component</code>

 Defines the Marionette.View that will be rendered when the route is activated

```js
const NoteRoute = Route.extend({
  component: NoteLayoutView
});
```

### <code>viewOptions</code>

 Defines the options to be passed in the Marionette.View constructor

```js
const NoteListRoute = Route.extend({
  component: NoteListView,

  activate() {  // See activate below
    this.collection = new NoteCollection();
    this.collection.fetch();
  },

  viewOptions() {
    return {
      collection: this.collection
    };
  }
});
```

### <code>viewEvents</code>

 A hash defining listeners for the events triggered by the view

```js
const NoteCreateRoute = Route.extend({
  component: NoteCreateView,

  viewEvents: {
    'note:created': 'addNoteToCollection'
  },

  addNoteToCollection(model) {
    this.collection.add(model);
    Radio.channel('router').request('transitionTo', 'note.list');
  }
})
```

### <code>contextRequests</code>

 A hash defining reply functions to requests done by [child routes](#childRoutes)
 through [getContext](#getContext)

```js
const NoteDetailRoute = Route.extend({
  // ...
  childRoutes: {
    'note.edit': NoteEditRoute  // See childRoutes below
  },

  activate(transition) {  // See activate above
    this.noteModel = new NoteModel({ id: parseInt(transition.params.noteId) });
    this.noteModel.fetch();
  },

  contextRequests: {
    noteModel() {
      return this.noteModel;
    }
  }
})
```

### <code>contextEvents</code>

 A hash defining listeners to events triggered by [child routes](#childRoutes)
 through [getContext](#getContext)

### <code>childRoutes</code>

 A hash defining route definitions for children routes

```js
const NoteRoute = Route.extend({
  childRoutes: {
    'note.list': NoteListRoute,
    'note.detail': NoteDetailRoute,
    'note.create': NoteCreateRoute
  }
});
```
