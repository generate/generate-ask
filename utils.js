'use strict';

var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Module dependencies
 */

require('base-questions', 'questions');
require('isobject', 'isObject');
require('mixin-deep', 'merge');
require('namify', 'namify');
require('parse-github-url');
require('question-match', 'match');

/**
 * Restore `require`
 */

require = fn;

/**
 * Expose `utils` modules
 */

module.exports = utils;
