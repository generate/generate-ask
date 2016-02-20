'use strict';

var merge = require('mixin-deep');
var project = require('project-name');
var namify = require('namify');

/**
 * Generic prompts for commonly used project data
 */

module.exports = function(app, base) {

  /**
   * Load options from the `base` (shared) instance onto the generator's options
   */

  app.option(base.options);

  /**
   * Author questions
   */

  app.task('author', { silent: true }, function(cb) {
    base.assertPlugin('base-questions');
    base.questions.clear();
    base.questions
      .set('author.name', 'Author\'s name?', {
        default: get('author.name')
      })
      .set('author.username', 'Author\'s GitHub username?', {
        default: get('author.username')
      })
      .set('author.twitter', 'Author\'s twitter username?', {
        default: get('author.twitter')
      })
      .set('author.email', 'Author\'s email address?', {
        default: get('author.email')
      })
      .set('author.url', 'Author\'s URL?', {
        default: get('author.url')
      });
    app.build('ask', cb);
  });

  /**
   * Ask project-relaed questions
   */

  app.task('project', function(cb) {
    base.assertPlugin('base-questions');
    base.questions.clear();
    base.questions
      .set('project.name', 'Project name?', {
        default: get('project.name') || base.project || project(base.cwd),
        force: true
      })
      .set('project.owner', 'Project owner?', {
        default: get('project.owner'),
        force: true
      })
      .set('project.description', 'Project description?', {
        default: get('project.description'),
        force: true
      });
    app.build('ask', cb);
  });

  /**
   * Ask questions
   */

  app.task('ask', { silent: true }, function(cb) {
    base.assertPlugin('base-questions');

    base.prompt(function(err, answers) {
      if (err) return cb(err);
      base.answers(answers);

      var project = base.answers('project') || {};
      var name = base.answers('name') || project.name;
      if (name) {
        base.answers('varname', base.option('var') || namify(name));
        base.answers('alias', base.toAlias(name));
      }
      base.answers(merge({}, project));
      cb();
    });
  });

  /**
   * util for getting data from the generator instance,
   * base (shared) instance, or config store
   */

  function get(prop) {
    var val = app.data(prop);
    if (typeof val === 'undefined') {
      val = base.data(prop);
    }
    if (typeof val === 'undefined') {
      val = app.store.get(prop);
    }
    if (typeof val === 'undefined') {
      return null;
    }
    return val;
  }

  /**
   * Default task
   */

  app.task('default', { silent: true }, ['ask']);
};

/**
 * Setup questions, clear data before prompting if necessary
 */

function setup(app) {
  app.set('cache.data.project', merge({}, app.cache.data));

  app.questions.setData(app.store.data);
  app.questions.setData(app.pkg.data);

  app.questions.off('ask', askHandler);
  app.questions.on('ask', askHandler);

  function askHandler(name, question) {
    if (app.enabled('force') || name.indexOf('author') !== 0) {
      question.force();
    } else {
      var answer = app.data(name);
      if (typeof answer !== 'undefined') {
        question.answer.set(answer);
        return;
      }

      answer = app.store.get(name);
      if (typeof answer !== 'undefined') {
        question.answer.set(answer);
        return;
      }
      question.force();
    }
  }

  app.questions.off('answer', answerHandler);
  app.questions.on('answer', answerHandler);

  function answerHandler(key, val, question) {
      if (typeof val === 'string' && val.trim() === '()') {
        question.answer.del();
        return;
      }

      if (key.indexOf('author') === 0 && val) {
        question.answer.setDefault(key, val);
        app.store.set(key, val);
      }

      if (key.indexOf('project') === 0 && val) {
        question.answer.set(key, val);
        app.store.local.set(key, val);
      }
    }
  }

function toAlias(name) {
  return name.slice(name.lastIndexOf('-') + 1);
}
