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
        expect(error).toBeNull();
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
        expect(error).not.toBeNull();
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
        expect(error).toBeNull();
        expect(fn1).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });


    it('works with no functions', function (next) {
      var context = { test: true };
      var reactor = reactions.make.series([]); 

      reactor(context, function (error, data) {
        expect(data).toBe(context);
        expect(error).toBeNull();
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
        expect(error).toBeNull();
        expect(fn2).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });

  });

  describe('parallel', function (argument) {
    
    

  });

});