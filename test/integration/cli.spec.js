'use strict';

var cli = require('../../lib/cli/cli');

describe('Cli', function() {
  describe('#main()', function() {
    it('runs a test', function() {
      return cli.main(['test/integration/fixtures/passing.fixture.js']);
    });
  });
});
