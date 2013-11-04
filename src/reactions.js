(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Reactions = factory();
  }
}(this, function () {
  'use strict';
  var EMPTY_FUNCTION = function () {};

  var Reactions = {};

  /** 
   * Creates a 'done' function.
   * @argument defaultDone - the done function to delegate to.
   * @argument success - [optional] - the success function to delegate to.
   * A done function can be invoked only once, receives an error and callback
   * in case of error invokes the defaultDone passing the error
   * in case of success invokes sucess passing the data or 
   * the defaultDone if no success is present passing false as first argument and
   * data as the second
   */
  Reactions.done = function (defaultDone, success) {
    var invoked = false;
    if (typeof success !== 'function')
      success = function (data) { defaultDone(false, data); };
    
    return function (error, data) {
      if (invoked)
        throw new Error('callback functions should be invoked only once');
      invoked = true;
      Reactions.invokeLater(function () {
        if (error)
          defaultDone(error);
        else 
          success(data);
      });
    };
  };

  /**
   * Invokes the passed function later in the event queue. 
   * Essentially cross-platform implementation of process.nextTick
   */
  //TODO: use a better implementation for the browsers, as setTimeout(fn, 0) is quite slow
  Reactions.invokeLater = (process && process.nextTick && typeof process.nextTick === 'function')?
      process.nextTick:
      function (fn) { setTimeout(fn, 0); };


  Reactions.fn = {};
  /**
   * Invoke all reactions in order, waiting for the previous to complete. 
   * All reactions and done are invoked with the original context.
   * Executions stops on first error and done(error) is invoked
   */
  Reactions.fn.series = function(reactions, context, done) {
    var results = [];
    var toRun = -1;
    function next(error, value) {
      if (error) {
        done(error);
        return;
      }
      results[toRun] = value;
      toRun += 1;
      if (toRun < reactions.length) {
        reactions[toRun].call(null, context, Reactions.done(next));
      } else {
        done(null, context);
      }
    }
    next();
  };

  /**
   * Execution of the reactions is started in the order in which they appear. 
   * done is invoked when all reactions complete successfully or on the first received error
   */
  Reactions.fn.parallel = function(reactions, context, done) {
    var countback = reactions.length + 1;
    var finished = false;
    function next(error, data) {
      if (finished) return; //callback has been invoked already

      if (error) {
        finished = true;
        done(error);
        return;
      }
      countback -= 1;
      if (countback === 0)
        done(null, context);
    }

    for (var i = 0; i < reactions.length; i ++) {
      reactions[i].call(null, context, Reactions.done(next));
    }

    next();
  };

 /**
  * Each reactions is invoked using the result of the previous one as context.
  * The first is fed the original context. Done is invoked with the result of the last one.
  * Execution is stopped on error and done(error) is invoked.
  */
  Reactions.fn.waterfall = function (reactions, context, done) {
    if (reactions.length > 0) {
      var head = reactions[0];
      var tail = reactions.slice(1);
      head.call(null, context, Reactions.done(done, function (data) {
        Reactions.fn.waterfall(tail, data, done);
      }));
    } else {
      done(false, context);
    }
  };

  function constructMakeFn(fn) {
    return function () {
      var argcount = fn.length - 2;
      var args = Array.prototype.slice.call(arguments, 0, argcount); //all arguments except context and done
      return function (world, done) {
        args = args.slice(0);
        args.push(world);
        args.push(done);
        fn.apply(null, args);
      };
    }; 
  }

 /**
  * Reactions.make.XXX is expecting all the arguments of Reactions.fn.XXX except context and done and
  * creates a function(context, done)
  */
  Reactions.make = {};
  //attach the make functions
  for (var key in Reactions.fn) {
    Reactions.make[key] = constructMakeFn(Reactions.fn[key]);
  }

  return Reactions;
}));