/* global describe: false */
/* global it: false */
/* global expect: false */
/* global beforeEach: false */
/* global jasmine: false */
/* jshint maxstatements: 30 */


(function (Reactions) {
  'use strict'; 

  /*
  * A reaction (starting with the first) is invoked passing the original context.
  *   If there are no reactions done(false) is invoked.
  * Upon succeeding with falsy data the steps are repeated for the next reaction.
  * Upon succeeding with truthy data the done(false, data) is invoked.
  * Upon error the done(error) is invoked.
  */
  describe('Reactions.make.first', function () {
    
    var falsyResultReaction, truthyResultReaction, errorReaction;
    beforeEach(function () {
      falsyResultReaction = jasmine.createSpy('falsySuccessReactions')
      .andCallFake(function (context, done) {
        done(false);
      });

      truthyResultReaction = jasmine.createSpy('falsySuccessReactions')
      .andCallFake(function (context, done) {
        done(false, 'success');
      });

      errorReaction = jasmine.createSpy('errorReaction')
      .andCallFake(function (context, done) {
        done(new Error('test induced error'));
      });
    });

    it('is a function', function () {
      expect(Reactions.make.first).toEqual(jasmine.any(Function));
    });

    it('returns a function when passed an array', function () {
      expect(Reactions.make.first([])).toEqual(jasmine.any(Function));
    });

    describe('first reaction of []', function () {
      var firstReaction;
      beforeEach(function () {
        firstReaction = Reactions.make.first([]);
      });

      it('invokes done(falsy, falsy)', function (next) {
        var context = {};
        firstReaction(context, function (err, data) {
          expect(err).toBeFalsy();
          expect(data).toBeFalsy();
          next();
        });
      });
    });

    describe('first reaction of [{not returning data}]', function () {
      var firstReaction;
      beforeEach(function () {
        firstReaction = Reactions.make.first([falsyResultReaction]);
      });

      it('invokes done(falsy, falsy)', function (next) {
        var context = {};
        firstReaction(context, function (err, data) {
          expect(err).toBeFalsy();
          expect(data).toBeFalsy();
          expect(falsyResultReaction).toHaveBeenCalled();
          next();
        });
      });
    });

    describe('first reaction of [{returning data}]', function () {
      var firstReaction;
      beforeEach(function () {
        firstReaction = Reactions.make.first([truthyResultReaction]);
      });

      it('invokes done(falsy, falsy)', function (next) {
        var context = {};
        firstReaction(context, function (err, data) {
          expect(err).toBeFalsy();
          expect(data).toEqual('success');
          expect(truthyResultReaction).toHaveBeenCalled();
          next();
        });
      });
    });
    
    describe('first reaction of [{not returning data}, {returning data}]', function () {
      var firstReaction;
      beforeEach(function () {
        firstReaction = Reactions.make.first([falsyResultReaction, truthyResultReaction]);
      });

      it('invokes done(falsy, falsy)', function (next) {
        var context = {};
        firstReaction(context, function (err, data) {
          expect(err).toBeFalsy();
          expect(data).toEqual('success');
          expect(falsyResultReaction).toHaveBeenCalled();
          expect(truthyResultReaction).toHaveBeenCalled();
          next();
        });
      });
    });

    describe('first reaction of [ {returning data}, {not returning data}]', function () {
      var firstReaction;
      beforeEach(function () {
        firstReaction = Reactions.make.first([truthyResultReaction, falsyResultReaction]);
      });

      it('invokes done(falsy, falsy)', function (next) {
        var context = {};
        firstReaction(context, function (err, data) {
          expect(err).toBeFalsy();
          expect(data).toEqual('success');
          expect(truthyResultReaction).toHaveBeenCalled();
          expect(falsyResultReaction).not.toHaveBeenCalled();
          next();
        });
      });
    });

    describe('first reaction of [{returning error}, {not returning data}, {returning data}]', function () {
      var firstReaction;
      beforeEach(function () {
        firstReaction = Reactions.make.first([errorReaction, falsyResultReaction, truthyResultReaction]);
      });

      it('invokes done(falsy, falsy)', function (next) {
        var context = {};
        firstReaction(context, function (err, data) {
          expect(err).toEqual(jasmine.any(Error));
          expect(data).toBeFalsy();
          expect(errorReaction).toHaveBeenCalled();
          expect(falsyResultReaction).not.toHaveBeenCalled();
          expect(truthyResultReaction).not.toHaveBeenCalled();
          next();
        });
      });
    });

  });

}(require('../src/reactions')));
