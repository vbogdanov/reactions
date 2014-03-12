/* global describe: false */
/* global it: false */
/* global expect: false */
/* global beforeEach: false */
/* global jasmine: false */
/* jshint maxstatements: 30 */


(function (Reactions) {
  'use strict'; 

  describe('Reactions.make.mapHash', function () {
    it('returns a hash with the same keys and mapped values', function (next) {
      var toMap = {
        'a': 5,
        'b': 6,
        'c': 7
      };

      var expected = {};
      for (var key in toMap) {
        expected[key] = -toMap[key];
      }

      var mapFn = function (val, done) {
        done(false, -val);
      };

      Reactions.fn.mapHash(mapFn, toMap, function(err, data) {
        expect(err).toBeFalsy();
        expect(data).toEqual(expected);
        next();
      });

    });
  });

}(require('../src/reactions')));
