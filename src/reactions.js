(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Reactions = factory();
  }
}(this, 
/**
 * Reactions is providing tools for working with Reaction(:Context, :Done) and Done(:Error, result) functions
 * @exports Reactions
 */
function () {
  'use strict';
  var EMPTY_FUNCTION = function () {};

  var exports = {};

  /**
   * Creates a 'done' function.
   * A done function can be invoked only once, receives an error and callback
   * in case of error invokes the defaultDone passing the error
   * in case of success invokes success passing the data or 
   * the defaultDone if no success is present passing false as first argument and
   * data as the second
   *
   * @param {Function} defaultDone - the done function to delegate to.
   * @param {Function=} success - the success function to delegate to.
   * @param {any=} param - a parameter to pass as third one to 
   * the callback function or second one to the success function. Intended for passing
   * of additional argument(s) on success.
   */
  exports.done = function (defaultDone, success, param) {
    var invoked = false;
    if (typeof success !== 'function')
      success = function (data, param) { defaultDone(false, data, param); };
    
    return function (error, data) {
      if (invoked)
        throw new Error('callback functions should be invoked only once');
      invoked = true;
      exports.invokeLater(function () {
        if (error)
          defaultDone(error);
        else 
          success(data, param);
      });
    };
  };

  /**
   * Creates a 'done' function. Unlike done, fastdone invokes the proper handler in the same event handling
   * A done function can be invoked only once, receives an error and callback
   * in case of error invokes the defaultDone passing the error
   * in case of success invokes success passing the data or 
   * the defaultDone if no success is present passing false as first argument and
   * data as the second
   *
   * @param {Function} defaultDone - the done function to delegate to.
   * @param {Function=} success - the success function to delegate to.
   * @param {any=} param - a parameter to pass as third one to 
   * the callback function or second one to the success function. Intended for passing
   * of additional argument(s) on success.
   */
  exports.fastdone = function (defaultDone, success, param) {
    var invoked = false;
    if (typeof success !== 'function')
      success = function (data, param) { defaultDone(false, data, param); };
    
    return function (error, data) {
      if (invoked)
        throw new Error('callback functions should be invoked only once');
      invoked = true;
      if (error)
        defaultDone(error);
      else 
        success(data, param);
    };
  };

  //TODO: use a better implementation for the browsers, as setTimeout(fn, 0) is quite slow
  /**
   * Invokes the passed function later in the event queue. 
   * Essentially cross-platform implementation of process.nextTick
   * @method
   * @param {Function} callback - to be invoked at a later time
   */
  exports.invokeLater = (process && process.nextTick && typeof process.nextTick === 'function')?
      process.nextTick:
      function (fn) { setTimeout(fn, 0); };

  /**
   * A reaction returning its context immidiately
   * @method
   * @param {any} context - the context to return
   * @param {Done} done - the done function.
   */
  exports.echo = function (context, done) {
    done(false, context);
  };

  /** @namespace */
  exports.fn = {};

  /**
   * Invoke all reactions in order, waiting for the previous to complete. 
   * All reactions are invoked with the original context. Done is invoked with the array of data returned by the reactions
   * Executions stops on first error and done(error) is invoked
   * @param {Array} reactions
   * @param {any}  context
   * @param {Done}  done
   */
  exports.fn.collectSeries = function(reactions, context, done) {
    var results = [];
    var toRun = 0;
    function run() {
      if (toRun < reactions.length) {
        reactions[toRun].call(null, context, exports.done(next));
      } else {
        done(false, results);
      }
    }
    function next(error, value) {
      if (error) {
        done(error);
        return;
      }
      results[toRun] = value;
      toRun += 1;
      run();
    }
    run();
  };

  /**
   * Invoke all reactions in order, waiting for the previous to complete. 
   * All reactions and done are invoked with the original context.
   * Executions stops on first error and done(error) is invoked
   * @param {Array} reactions
   * @param {any}  context
   * @param {Done}  done
   */
  exports.fn.series = function(reactions, context, done) {
    exports.fn.collectSeries(reactions, context, function (err, data) {
      if (err) {
        done(err);
      } else {
        done(false, context);
      }
    });
  };

  /**
   * Execution of the reactions is started in the order in which they appear. 
   * done is invoked when all reactions complete successfully or on the first received error
   * data passed to Done is the array of the datas returned by the reactions
   * @param {Array} reactions
   * @param {any}  context
   * @param {Done}  done
   */
  exports.fn.collectParallel = function(reactions, context, done) {
    if (reactions.length === 0) {
      done(false, []);
      return;
    }
    var countback = reactions.length;
    var finished = false;
    var results = [];
    function next(error, data, index) {
      if (finished) return; //callback has been invoked already

      if (error) {
        finished = true;
        done(error);
        return;
      }
     
      if (index >= 0) {
        results[index] = data;
      }
      
      countback -= 1;
      
      if (countback === 0) {
        done(false, results);
      }
    }

    for (var i = 0; i < reactions.length; i ++) {
      reactions[i].call(null, context, exports.done(next, undefined, i));
    }
  };

  /**
   * Execution of the reactions is started in the order in which they appear. 
   * done is invoked when all reactions complete successfully or on the first received error
   * data passed to Done is the context object. It might have been changed by the reactions
   * @param {Array} reactions
   * @param {any}  context
   * @param {Done}  done
   */
  exports.fn.parallel = function(reactions, context, done) {
    exports.fn.collectParallel(reactions, context, function (err, data) {
      if(err) {
        done(err);
      } else {
        done(false, context);
      }
    });
  };

  /**
  * Each reactions is invoked using the result of the previous one as context.
  * The first is fed the original context. Done is invoked with the result of the last one.
  * Execution is stopped on error and done(error) is invoked.
  * @param {Array} reactions
  * @param {any}  context
  * @param {Done}  done
  */
  exports.fn.waterfall = function (reactions, context, done) {
    if (reactions.length > 0) {
      var head = reactions[0];
      var tail = reactions.slice(1);
      head.call(null, context, exports.done(done, function (data) {
        exports.fn.waterfall(tail, data, done);
      }));
    } else {
      done(false, context);
    }
  };

  /**
  * A reaction (starting with the first) is invoked passing the original context.
  *   If there are no reactions done(false) is invoked.
  * Upon succeeding with falsy data the steps are repeated for the next reaction.
  * Upon succeeding with truthy data the done(false, data) is invoked.
  * Upon error the done(error) is invoked.
  * @param {Array} reactions
  * @param {any}   context
  * @param {Done}  done
  */
  exports.fn.first = function (reactions, context, done) {
    if (reactions.length === 0) {
      done(false);
      return;
    }
    var head = reactions[0];
    var tail = reactions.slice(1);
    head(context, exports.done(done, function (success) {
      if (success) {
        done(false, success);
      } else {
        exports.fn.first(tail, context, done);
      }
    }));
  };

  /**
  * Invokes the ifReaction, and according to its result invokes either trueReaction or falseReaction. 
  * Continuation variant of `if (ifReaction()) trueReaction(); else falseReaction();`
  * @param {Reaction} ifReaction
  * @param {Reaction} trueReaction
  * @param {Reaction} falseReaction
  * @param {any}      context
  * @param {Done}     done
  */
  exports.fn.ifelse = function (ifReaction, trueReaction, falseReaction, context, done) {
    exports.fn.switch(ifReaction, { 'true': trueReaction, 'false': falseReaction }, context, done);
  };

  exports.fn.while = function (whileReaction, trueReaction, context, done) {
    whileReaction(context, function (err, data) {
      if (err) return done(err);
      
      if (data) {
        trueReaction(context, function (err2, data2) {
          if (err2) return done(err2);
          exports.fn.while(whileReaction, trueReaction, context, done);
        });
      } else {
        done(false, context);
      }
    });
  };

  /**
   * Switches between multiple reactions based on the results from the keyReaction. 
   * Both the keyReaction and the chosen reaction are passed the context. 
   * The chosen reaction is passed the original done.
   * If the keyReaction results in error the done(error) is invoked and no reaction is chosen.
   * If the reaction map does not contain a reaction matching the result of keyReaction the 'default' reaction is invoked. 
   * In case such a reaction (default) is not present, done(false, context) is invoked.
   *
   * @param {Reaction} keyReaction - a reaction returning the key for the chosen reaction.
   * @param {Hash} reactionMap - a javascript object whose properties contain reactions.
   * @param {any}  context - the context to use
   * @param {Done} done
   * @continuation error or success from the chosen reaction
   */
  exports.fn.switch = function (keyReaction, reactionMap, context, done) {
    keyReaction(context, function (err, data) {
      if (err) return done(err);
      var doFunction = reactionMap[data] || reactionMap['default'];
      if (typeof doFunction === 'function')
        doFunction(context, done);
      else
        done(false, context);
    });
  };

  /**
   * Map function  executes `context.map(mapReaction)` with 
   * continuation passing style / async mapReaction
   * It requires the context to be an array.
   *
   * @param {Reaction} mapReaction - reaction mapping from context item to the result item
   * @param {Array} context
   * @param {Done}  done
   */
  exports.fn.map = function (mapReaction, context, done) {
    if (context.length === 0) {
      done(false, []);
      return;
    }
    //context must be an array
    var result = [];
    var count = context.length;
    var success = function (data, index) {
      result[index] = data;
      count --;
      if (count === 0) {
        done(false, result);
      }
    };
    context.forEach(function (item, index) {
      mapReaction(item, exports.done(done, success, index));
    });
  };

  /**
   * MapHash function executes the mapping function for every property of hash
   * and add the results under the same key in a new hash. 
   * Current implementation is serial, but can be made parallel
   * It requires the context to be a hash (JavaScript object).
   *
   * @param {Reaction} mapReaction - reaction mapping from context item to the result item
   * @param {Object} context
   * @param {Done}  done
   */
  exports.fn.mapHash = function (mapReaction, hash, done) {
    var keys = Object.keys(hash);
    if (keys.length === 0)
      return done(false, {});

    var reduceToMap = function (context, d) {
      var k = context.current;
      var nh = context.initial;
      mapReaction(hash[k], exports.fastdone(d, function (result) {
        nh[k] = result;
        d(false, nh);
      }));
    };

    exports.fn.reduce({}, reduceToMap, keys, done);
  };

   /**
   * Map function  executes `context.reduce(reduceReaction, initial)` with 
   * continuation passing style / async mapReaction
   * It requires the context to be an array.
   *
   * @param intial - intial value
   * @param {Reaction} reduceReaction - reaction receiving { "initial": ... , "current": ... } context and required to pass the intial value of the next invokation
   * @param {Array} context
   * @param {Done} done
   */
  exports.fn.reduce = function (initial, reduceReaction, context, done) {
    //context must be an array
    if (context.length > 0) {
      var head = context[0];
      var tail = context.slice(1);
      reduceReaction({ 'initial': initial, 'current': head }, exports.done(done, function (value) {
        exports.fn.reduce(value, reduceReaction, tail, done);
      }));
    } else {
      done(false, initial);
    }
  };
  

  /**
  * Constructs a function that will do partial execution the passed fn.
  * The last two arguments are expected at a later time. The are supposedly context and done.
  * @function
  * @private
  * @param {Function} fn - the function to make partial execution function for
  */
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
  * Reactions.make contains functions with the same names as those in {@link module:Reactions.fn}.
  * They accept the same arguments except context and done and
  * return a Reaction (function (context, done))
  * @namespace
  */
  exports.make = {};
  //attach the make functions
  for (var key in exports.fn) {
    exports.make[key] = constructMakeFn(exports.fn[key]);
  }

  return exports;
}));