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
 by one of the parent routes through
 [`contextEvents`](#contextEvents) and [`contextRequests`](#contextRequests).

```js
const NoteEditRoute = Route.extend({
  viewClass: NoteEditView,

  viewOptions() {
    return {
      model: this.getContext().request('noteModel')
    };
  }
})
```

### <code>updateView(transition)</code>

 Called when the view associated with the route is about to be re-rendered.

Allows to configure how a view already rendered will be updated. Returning
a truthy value will prevent the default behavior (render a new view)

## Properties

### <code>viewClass</code>

 Defines the Marionette.View that will be rendered when the route is activated

```js
const NoteRoute = Route.extend({
  viewClass: NoteLayoutView
});
```

### <code>viewOptions</code>

 Defines the options to be passed in the Marionette.View constructor

```js
const NoteListRoute = Route.extend({
  viewClass: NoteListView,

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
  viewClass: NoteCreateView,

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
