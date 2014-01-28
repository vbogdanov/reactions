/* global describe: false */
/* global it: false */
/* global expect: false */
/* global beforeEach: false */
/* global jasmine: false */
/* jshint maxstatements: 30 */


(function (Reactions) {
  'use strict'; 

  describe('Reactions.echo', function () {
    it('returns the context passed as data', function (next) {
      var value = 'randomValue';
      Reactions.echo(value, function (err, data) {
        expect(err).toBeFalsy();
        expect(data).toBe(value);
        next();
      });
    });
  });

}(require('../src/reactions')));
