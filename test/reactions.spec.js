/* global describe: false */
/* global it: false */
/* global expect: false */
/* global beforeEach: false */
/* global jasmine: false */
/* jshint maxstatements: 30 */
'use strict';

var reactions = require('../src/reactions');

function simpleR(context, done) {
  done(null, {});
}

describe('reactions', function (argument) {
  var fn1, fn2, fn3, fnErr;
  beforeEach(function () {
      fn1 = jasmine.createSpy('1').andCallFake(simpleR);
      fn2 = jasmine.createSpy('2').andCallFake(simpleR);
      fn3 = jasmine.createSpy('3').andCallFake(simpleR);
      fnErr = jasmine.createSpy('error spy').andCallFake(function (context, cb) {
        cb(new Error('test error'));
      });
  });


  it('is an object', function () {
    expect(reactions).toEqual(jasmine.any(Object));
  });

  describe('series', function (argument) {
    
    it('is a function', function () {
      expect(reactions.make.series).toEqual(jasmine.any(Function));
    });

    it('invokes the reactions passing the original context', function (next) {
      var context = { test: true };
      var reactor = reactions.make.series([fn1, fn2, fn3]);

      reactor(context, function (error, data) {
        expect(data).toBe(context);
        expect(error).toBeFalsy();
        [fn1, fn2, fn3].forEach(function (fn) {
          expect(fn).toHaveBeenCalledWith(context, jasmine.any(Function));
        });
        next();
      });
    });

    it('stops after the first exception and passes it to the done', function (next) {
      var context = { test: true };
      var reactor = reactions.make.series([fn1, fnErr, fn3]); 

      reactor(context, function (error, data) {
        expect(data).toBeUndefined();
        expect(error).not.toBeFalsy();
        expect(fn1).toHaveBeenCalledWith(context, jasmine.any(Function));
        expect(fnErr).toHaveBeenCalledWith(context, jasmine.any(Function));
        expect(fn3).not.toHaveBeenCalled();
        next();
      });
    });

    it('works with only one function', function (next) {
      var context = { test: true };
      var reactor = reactions.make.series([fn1]); 

      reactor(context, function (error, data) {
        expect(data).toBe(context);
        expect(error).toBeFalsy();
        expect(fn1).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });


    it('works with no functions', function (next) {
      var context = { test: true };
      var reactor = reactions.make.series([]); 

      reactor(context, function (error, data) {
        expect(data).toBe(context);
        expect(error).toBeFalsy();
        next();
      });
    });


    it('invokes them in order', function (next) {
      var context = { test: true };
      var delayedFirst = function (world, done) {
        setTimeout(function () {
          expect(fn2).not.toHaveBeenCalled();
          done(null, world);
        }, 100);
      };
      var reactor = reactions.make.series([delayedFirst, fn2]);

      reactor(context, function (error, data) {
        expect(data).toBe(context);
        expect(error).toBeFalsy();
        expect(fn2).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });

  });

  describe('parallel', function (argument) {
    
    it('is a function', function () {
      expect(reactions.make.parallel).toEqual(jasmine.any(Function));
    });

    it('invokes the reactions passing the original context', function (next) {
      var context = { test: true };
      var reactor = reactions.make.parallel([fn1, fn2, fn3]);

      reactor(context, function (error, data) {
        expect(data).toBe(context);
        expect(error).toBeFalsy();
        [fn1, fn2, fn3].forEach(function (fn) {
          expect(fn).toHaveBeenCalledWith(context, jasmine.any(Function));
        });
        next();
      });
    });

    it('passes the first exception to done', function (next) {
      var context = { test: true };
      var reactor = reactions.make.parallel([fn1, fnErr, fn3]); 

      reactor(context, function (error, data) {
        expect(data).toBeUndefined();
        expect(error).toBeDefined();
        expect(fn1).toHaveBeenCalledWith(context, jasmine.any(Function));
        expect(fnErr).toHaveBeenCalledWith(context, jasmine.any(Function));
        expect(fn3).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });

    it('works with only one function', function (next) {
      var context = { test: true };
      var reactor = reactions.make.parallel([fn1]); 

      reactor(context, function (error, data) {
        expect(data).toBe(context);
        expect(error).toBeFalsy();
        expect(fn1).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });


    it('works with no functions', function (next) {
      var context = { test: true };
      var reactor = reactions.make.parallel([]); 

      reactor(context, function (error, data) {
        expect(data).toBe(context);
        expect(error).toBeFalsy();
        next();
      });
    });


    it('invokes them in order', function (next) {
      var context = { test: true };
      var delayedFirst = function (world, done) {
        setTimeout(function () {
          expect(fn2).toHaveBeenCalled();
          done(null, world);
        }, 100);
      };
      var reactor = reactions.make.parallel([delayedFirst, fn2]);

      reactor(context, function (error, data) {
        expect(data).toBe(context);
        expect(error).toBeFalsy();
        expect(fn2).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });

  });


  describe('waterfall', function (argument) {
    var fn1, fn2, fn3;
    function addOne(context, done) {
      done(false, context + 1);
    }
    beforeEach(function () {
      fn1 = jasmine.createSpy('1').andCallFake(addOne);
      fn2 = jasmine.createSpy('2').andCallFake(addOne);
      fn3 = jasmine.createSpy('3').andCallFake(addOne);
    });
    
    it('is a function', function () {
      expect(reactions.make.waterfall).toEqual(jasmine.any(Function));
    });

    it('invokes the reactions passing the result of the previous as context', function (next) {
      var reactor = reactions.make.waterfall([fn1, fn2, fn3]);

      reactor(0, function (error, data) {
        expect(data).toBe(3);
        expect(error).toBeFalsy();
        [fn1, fn2, fn3].forEach(function (fn, index) {
          expect(fn).toHaveBeenCalledWith(index, jasmine.any(Function));
        });
        next();
      });
    });

    it('passes the first exception to done', function (next) {
      var reactor = reactions.make.waterfall([fn1, fnErr, fn3]); 

      reactor(0, function (error, data) {
        expect(data).toBeUndefined();
        expect(error).toBeDefined();
        expect(fn1).toHaveBeenCalledWith(0, jasmine.any(Function));
        expect(fnErr).toHaveBeenCalledWith(1, jasmine.any(Function));
        expect(fn3).not.toHaveBeenCalled();
        next();
      });
    });

    it('works with only one function', function (next) {
      var reactor = reactions.make.waterfall([fn1]); 

      reactor(0, function (error, data) {
        expect(data).toBe(1);
        expect(error).toBeFalsy();
        expect(fn1).toHaveBeenCalledWith(0, jasmine.any(Function));
        next();
      });
    });


    it('works with no functions', function (next) {
      var reactor = reactions.make.waterfall([]); 

      reactor(0, function (error, data) {
        expect(data).toBe(0);
        expect(error).toBeFalsy();
        next();
      });
    });


    it('invokes them in order', function (next) {
      var delayedFirst = function (world, done) {
        setTimeout(function () {
          expect(fn2).not.toHaveBeenCalled();
          done(false, world + 1);
        }, 100);
      };
      var reactor = reactions.make.waterfall([delayedFirst, fn2]);

      reactor(40, function (error, data) {
        expect(data).toBe(42);
        expect(error).toBeFalsy();
        expect(fn2).toHaveBeenCalledWith(41, jasmine.any(Function));
        next();
      });
    });

  });

});