
import { expect } from 'chai';
import {Route, createRouter, middleware} from '../src/index';

describe('Lifecycle hooks', () => {

  beforeEach(() => {
    var router = createRouter()
    router.map()
    router.use(middleware)    
  })

  afterEach(() => {
    router.destroy
  })


  describe('activate', () => {


    it('should return welcome message for a guest user', () => {
      const greeting = new Greeting();
      const message = greeting.hello();
      expect(message).to.be.equal('Welcome, Guest!');
    });

    it('should return welcome message for a named user', () => {
      const greeting = new Greeting('John');
      const message = greeting.hello();
      expect(message).to.be.equal('Welcome, John!');
    });

  });

});
