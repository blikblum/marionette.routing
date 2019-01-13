## marionette.routing log

### [v1.0.0] - 2019-1-13

 - Allow to define rootRegion by passing a selector / HTML element or Region instance to Router constructor

### [v0.12.0] - 2018-11-29

 - Export a Router class instead of createRouter / destroyRouter functions

### [v0.11.0] - 2018-11-28

 - Register middleware by default

### [v0.10.0] - 2018-11-25

- Update Cherrytreex dependency
- Implement async deactivate lifecycle method
- Run tests through karma

### [v0.9.0] - 2018-06-17

- Bump Marionette requirement to v4

### [v0.8.0] - 2018-04-14

- Migrate to cherrytreex (a cherrytree fork with a few improvements)
- `transition` and `transition:error` events now are fired before transition then and catch handlers respectively

### [v0.7.0] - 2017-08-04

- Add `load` lifecycle method 
- Allow to customize or suppress active class set in RouterLink 
- Allow to define RouterLink defaults as function 
- Add `isTarget` and `isActivating` method to transition object
