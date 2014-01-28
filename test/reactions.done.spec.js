/* global describe: false */
/* global it: false */
/* global expect: false */
/* global beforeEach: false */
/* global jasmine: false */
/* jshint maxstatements: 30 */


(function (Reactions) {
  'use strict'; 

  function commonBehavior(done) {
    it('can be called only once', function () {
      expect(function () {
        var d = done(function (error) {}, function (data) {});
        d(new Error());
        d(false, 'test');
      }).toThrow();
    });   
    
    it('calls the failure callback on error', function (next) {
      var spy = function (error) {
        expect(error).toEqual(jasmine.any(Error));
        next();
      };
      var d = done(spy, function (data) {});
      d(new Error());
    });

    it('calls success callback on success', function (next) {
      var spy = function (data) {
        expect(data).toEqual('good');
        next();
      };
      var d = done(function (error) {}, spy);
      d(false, 'good');
    });
  }

  describe('Reactions.done & Reactions.fastdone', function () {
    commonBehavior(Reactions.done);
    commonBehavior(Reactions.fastdone);
  });

}(require('../src/reactions')));
