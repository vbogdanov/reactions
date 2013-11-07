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

  describe('collectSeries', function (argument) {
    var fn1, fn2, fn3;
    function appender(val) {
      return function (context, done) {
        done(false, context + val);
      };
    }
    beforeEach(function () {
      fn1 = jasmine.createSpy('1').andCallFake(appender('1'));
      fn2 = jasmine.createSpy('2').andCallFake(appender('2'));
      fn3 = jasmine.createSpy('3').andCallFake(appender('3'));
    });

    it('is a function', function () {
      expect(reactions.make.collectSeries).toEqual(jasmine.any(Function));
    });

    it('invokes the reactions passing the original context', function (next) {
      var context = 't';
      var reactor = reactions.make.collectSeries([fn1, fn2, fn3]);

      reactor(context, function (error, data) {
        expect(data).toEqual(['t1', 't2', 't3']);
        expect(error).toBeFalsy();
        [fn1, fn2, fn3].forEach(function (fn) {
          expect(fn).toHaveBeenCalledWith(context, jasmine.any(Function));
        });
        next();
      });
    });

    it('stops after the first exception and passes it to the done', function (next) {
      var context = 't';
      var reactor = reactions.make.collectSeries([fn1, fnErr, fn3]); 

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
      var context = 't';
      var reactor = reactions.make.collectSeries([fn1]); 

      reactor(context, function (error, data) {
        expect(data).toEqual(['t1']);
        expect(error).toBeFalsy();
        expect(fn1).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });


    it('works with no functions', function (next) {
      var context = 't';
      var reactor = reactions.make.collectSeries([]); 

      reactor(context, function (error, data) {
        expect(data).toEqual([]);
        expect(error).toBeFalsy();
        next();
      });
    });


    it('invokes them in order', function (next) {
      var context = 't';
      var delayedFirst = function (world, done) {
        setTimeout(function () {
          expect(fn2).not.toHaveBeenCalled();
          done(null, 'delayed');
        }, 100);
      };
      var reactor = reactions.make.collectSeries([delayedFirst, fn2]);

      reactor(context, function (error, data) {
        expect(data).toEqual(['delayed','t2']);
        expect(error).toBeFalsy();
        expect(fn2).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });

  });

 describe('collectParallel', function (argument) {
    var fn1, fn2, fn3;
    function appender(val) {
      return function (context, done) {
        done(false, context + val);
      };
    }
    beforeEach(function () {
      fn1 = jasmine.createSpy('1').andCallFake(appender('1'));
      fn2 = jasmine.createSpy('2').andCallFake(appender('2'));
      fn3 = jasmine.createSpy('3').andCallFake(appender('3'));
    });


    it('is a function', function () {
      expect(reactions.make.collectParallel).toEqual(jasmine.any(Function));
    });

    it('invokes the reactions passing the original context', function (next) {
      var context = 't';
      var reactor = reactions.make.collectParallel([fn1, fn2, fn3]);

      reactor(context, function (error, data) {
        expect(data).toEqual(['t1', 't2', 't3']);
        expect(error).toBeFalsy();
        [fn1, fn2, fn3].forEach(function (fn) {
          expect(fn).toHaveBeenCalledWith(context, jasmine.any(Function));
        });
        next();
      });
    });

    it('passes the first exception to done', function (next) {
      var context = 't';
      var reactor = reactions.make.collectParallel([fn1, fnErr, fn3]); 

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
      var context = 't';
      var reactor = reactions.make.collectParallel([fn1]); 

      reactor(context, function (error, data) {
        expect(data).toEqual(['t1']);
        expect(error).toBeFalsy();
        expect(fn1).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });


    it('works with no functions', function (next) {
      var context = 't';
      var reactor = reactions.make.collectParallel([]); 

      reactor(context, function (error, data) {
        expect(data).toEqual([]);
        expect(error).toBeFalsy();
        next();
      });
    });


    it('invokes them in order', function (next) {
      var context = 't';
      var delayedFirst = function (world, done) {
        setTimeout(function () {
          expect(fn2).toHaveBeenCalled();
          done(null, 'world');
        }, 100);
      };
      var reactor = reactions.make.collectParallel([delayedFirst, fn2]);

      reactor(context, function (error, data) {
        expect(data).toEqual(['world', 't2']);
        expect(error).toBeFalsy();
        expect(fn2).toHaveBeenCalledWith(context, jasmine.any(Function));
        next();
      });
    });

  });
  
  describe('ifelse', function () {
    var trueFn, falseFn, fn1, fn2;
    beforeEach(function () {
      trueFn = jasmine.createSpy('trueFn').andCallFake(function (context, done) {
        done(false, true);
      });
      falseFn = jasmine.createSpy('falseFn').andCallFake(function (context, done) {
        done(false, false);
      });
      fn1 = jasmine.createSpy('fn1').andCallFake(function (context, done) {
        done(false, context + 1);
      });
      fn2 = jasmine.createSpy('fn2').andCallFake(function (context, done) {
        done(false, context + 2);
      });
    });

    it('is a function', function () {
      expect(reactions.make.ifelse).toEqual(jasmine.any(Function));
    });

    it('calls the ifReaction and if it returns true the calls trueReaction', function (next) {
      reactions.make.ifelse(trueFn, fn1, fn2)(0, function (err, data) {
        expect(err).toBeFalsy();
        expect(data).toEqual(1);
        expect(trueFn).toHaveBeenCalledWith(0, jasmine.any(Function));
        expect(fn1).toHaveBeenCalledWith(0, jasmine.any(Function));
        expect(fn2).not.toHaveBeenCalled();
        next();
      });
    });

    it('calls the ifReaction and if it returns false calls the falseReaction', function (next) {
      reactions.make.ifelse(falseFn, fn1, fn2)(0, function (err, data) {
        expect(err).toBeFalsy();
        expect(data).toEqual(2);
        expect(falseFn).toHaveBeenCalledWith(0, jasmine.any(Function));
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalledWith(0, jasmine.any(Function));
        next();
      });
    });

    it('calls the done(error) if ifReaction results in error', function (next) {
      reactions.make.ifelse(fnErr, fn1, fn2) (0, function (err, data) {
        expect(err).toEqual(jasmine.any(Error));
        expect(data).toBeUndefined();
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).not.toHaveBeenCalled();
        next();
      });
    });

    it('calls the done(error) if trueReaction results in error', function (next) {
      reactions.make.ifelse(trueFn, fnErr, fn2) (0, function (err, data) {
        expect(err).toEqual(jasmine.any(Error));
        expect(data).toBeUndefined();
        expect(trueFn).toHaveBeenCalled();
        expect(fn2).not.toHaveBeenCalled();
        next();
      });
    });

    it('calls the done(error) if falseReaction results in error', function (next) {
      reactions.make.ifelse(falseFn, fn1, fnErr) (0, function (err, data) {
        expect(err).toEqual(jasmine.any(Error));
        expect(data).toBeUndefined();
        expect(falseFn).toHaveBeenCalled();
        expect(fn1).not.toHaveBeenCalled();
        next();
      });
    });

    it('allows passing false instead of trueReaction', function (next) {
      reactions.make.ifelse(trueFn, false, fn2) (0, function (err, data) {
        expect(err).toBeFalsy();
        expect(data).toEqual(0);
        expect(trueFn).toHaveBeenCalled();
        expect(fn2).not.toHaveBeenCalled();
        next();
      });
    });

    it('allows passing false instead of falseReaction', function (next) {
      reactions.make.ifelse(falseFn, fn1, false) (0, function (err, data) {
        expect(err).toBeFalsy();
        expect(data).toEqual(0);
        expect(falseFn).toHaveBeenCalled();
        expect(fn1).not.toHaveBeenCalled();
        next();
      });
    });

  });

  describe('while', function () {
    var trueFn, falseFn, fn1, context;
    beforeEach(function () {
      trueFn = jasmine.createSpy('trueFn').andCallFake(function (context, done) {
        done(false, context.val < 3);
      });
      falseFn = jasmine.createSpy('falseFn').andCallFake(function (context, done) {
        done(false, false);
      });
      fn1 = jasmine.createSpy('fn1').andCallFake(function (context, done) {
        context.val += 1;
        done(false);
      });
      context = {
        val: 0
      };
    });

    it('is a function', function () {
      expect(reactions.make.while).toEqual(jasmine.any(Function));
    });

    it('calls the whileReaction and if it returns true the calls trueReaction', function (next) {
      reactions.make.while(trueFn, fn1)(context, function (err, data) {
        expect(err).toBeFalsy();
        expect(data).toEqual({ val: 3 });
        expect(trueFn).toHaveBeenCalledWith({ val: 3 }, jasmine.any(Function));
        expect(fn1).toHaveBeenCalledWith({ val: 3 }, jasmine.any(Function));
        next();
      });
    });

    it('calls the whileReaction and if it returns false calls the falseReaction', function (next) {
      reactions.make.while(falseFn, fn1)(context, function (err, data) {
        expect(err).toBeFalsy();
        expect(data).toEqual({ val: 0 });
        expect(falseFn).toHaveBeenCalledWith({ val: 0 }, jasmine.any(Function));
        expect(fn1).not.toHaveBeenCalled();
        next();
      });
    });

    it('calls the done(error) if whileReaction results in error', function (next) {
      reactions.make.while(fnErr, fn1) (context, function (err, data) {
        expect(err).toEqual(jasmine.any(Error));
        expect(data).toBeUndefined();
        expect(fn1).not.toHaveBeenCalled();
        next();
      });
    });

    it('calls the done(error) if trueReaction results in error', function (next) {
      reactions.make.while(trueFn, fnErr) (context, function (err, data) {
        expect(err).toEqual(jasmine.any(Error));
        expect(data).toBeUndefined();
        expect(trueFn).toHaveBeenCalled();
        next();
      });
    });

  });


  describe('switch', function () {
    var ALL_KEYS = ['Alice','Bob','Cat'];
    var AliceFn, BobFn, CatFn, AliceReaction, BobReaction, CatReaction, keyFunctions, reactionMap;
    beforeEach(function () {
      AliceFn = jasmine.createSpy('AliceFn').andCallFake(function (context, done) {
        done(false, 'Alice');
      });
      BobFn = jasmine.createSpy('BobFn').andCallFake(function (context, done) {
        done(false, 'Bob');
      });
      CatFn = jasmine.createSpy('CatFn').andCallFake(function (context, done) {
        done(false, 'Cat');
      });
      AliceReaction = jasmine.createSpy('AliceReaction').andCallFake(function (context, done) {
        context.Alice = true;
        done(false, context);
      });
      BobReaction = jasmine.createSpy('BobReaction').andCallFake(function (context, done) {
        context.Bob = true;
        done(false, context);
      });
      CatReaction = jasmine.createSpy('CatReaction').andCallFake(function (context, done) {
        context.Cat = true;
        done(false, context);
      });

      
      keyFunctions = {
        'Alice': AliceFn,
        'Bob': BobFn,
        'Cat': CatFn
      };
      reactionMap = {
        'Alice': AliceReaction,
        'Bob': BobReaction,
        'Cat': CatReaction
      };
    });

    it('is a function', function () {
      expect(reactions.make.switch).toEqual(jasmine.any(Function));
    });

    it('calls the done(error) if keyReaction results in error', function (next) {
      reactions.make.switch(fnErr, reactionMap) (0, function (err, data) {
        expect(err).toEqual(jasmine.any(Error));
        expect(data).toBeUndefined();
        expect(AliceReaction).not.toHaveBeenCalled();
        expect(BobReaction).not.toHaveBeenCalled();
        expect(CatReaction).not.toHaveBeenCalled();
        next();
      });
    });

    ALL_KEYS.forEach(function (key) {
      
      it('calls the keyReaction and the mapped reaction according to result', function (next) {
          var keyFn = keyFunctions[key];
          var context = {};
          reactions.make.switch(keyFn, reactionMap)(context, function (err, data) {
          expect(err).toBeFalsy();
          expect(data).toEqual(jasmine.any(Object));
          //keyFn:
          expect(keyFn).toHaveBeenCalledWith(context, jasmine.any(Function));
          //reactions:
          expect(reactionMap[key]).toHaveBeenCalledWith(context, jasmine.any(Function));
          for (var k in reactionMap) {
            if (k !== key) {
              expect(reactionMap[k]).not.toHaveBeenCalled();
            }
          }
          next();
        });
      });

      it('calls the done(error) if mappedReaction results in error', function (next) {
          reactionMap[key] = fnErr;
          var keyFn = keyFunctions[key];
          reactions.make.switch(keyFn, reactionMap) ({}, function (err, data) {
          expect(err).toEqual(jasmine.any(Error));
          expect(data).toBeUndefined();

          expect(keyFn).toHaveBeenCalled();
          for (var k in reactionMap) {
            if (k !== key) {
              expect(reactionMap[k]).not.toHaveBeenCalled();
            }
          }
          next();
        });
      });

    });

  });

});