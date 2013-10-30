(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.reactions = factory();
  }
}(this, function () {
  'use strict';


  var result = {
    'fn': {},
    'make': {}
  };

  result.fn.series = function(reactions, context, done) {
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
        reactions[toRun].call(null, context, next);
      } else {
        done(null, context);
      }
    }
    next();
  };

  result.fn.parallel = function(reactions, context, done) {
    var countback = reactions.length + 1;

    function next(error, data) {
      if (error) {
        done(error);
        return;
      }
      countback -= 1;
      if (countback === 0)
        done(null, context);
    }

    for (var i = 0; i < reactions.length; i ++) {
      reactions[i].call(null, context, next);
    }

    next();
  };

  //attack the make functions
  for (var key in result.fn) {
    var dofn = result.fn[key];
    result.make[key] = function () {
      var _key = key;
      var _dofn = dofn;
      var argcount = dofn.length - 2;
      var args = Array.prototype.slice.call(arguments, argcount);
      return function (world, done) {
        console.log('invoked make.' + _key);
        args = args.slice(0);
        args.push(world);
        args.push(done);
        _dofn.apply(null, args);
      };
    };
  }

  return result;
}));