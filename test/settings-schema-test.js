'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.settingsSchema = {
  setUp: function (done) {
    // setup here if necessary
    done();
  },
  schema: function (test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/settings-schema.json');
    var expected = grunt.file.read('test/expected/settings-schema.json');
    test.equal(actual, expected, 'generated settings schema matches expected result');

    test.done();
  },
  settings: function (test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/settings.json');
    var expected = grunt.file.read('test/expected/settings.json');
    test.equal(actual, expected, 'generated settings matches expected result');

    test.done();
  }
};
