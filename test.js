'use strict';

require('mocha');
var assert = require('assert');
var ask = require('./');

describe('generate-ask', function() {
  it('should export a function', function() {
    assert.equal(typeof ask, 'function');
  });
});
