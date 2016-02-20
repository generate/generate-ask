'use strict';

var merge = require('mixin-deep');
var project = require('project-name');
var questions = require('base-questions');
var namify = require('namify');

/**
 * Generic prompts for commonly used project data
 */

module.exports = function(app, base) {
  // use `base-questions` plugin
  app.use(questions(base.options));

  // load options from the shared instance onto the generator's options
  app.option(base.options);

  /**
   * Init questions
   */

  app.task('init', function(cb) {
    app.questions.clear();
    app.questions
      .set('init.intro', 'Would you like to disable the intro next time?')
      .set('init.tasks', 'Would you like to set default tasks to run?')
      .set('init.flags', 'Do you want to disable tasks when non-task flags are passed on argv (like `--set=foo`)?');
    app.build('ask', cb);
  });

  /**
   * Author questions
   */

  app.task('author', function(cb) {
    app.questions.clear();
    app.questions
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
    app.questions.clear();
    app.questions
      .set('project.name', 'Project name?', {
        default: get('project.name') || app.project || project(app.cwd),
        force: true
      })
      .set('project.owner', 'Project owner?', {
        default: get('project.owner'),
        force: true
      })
      .set('project.description', 'Project description?', {
        default: get('project.description'),
        force: true
      })
    app.build('ask', cb);
  });

  /**
   * Ask questions
   */

  app.task('ask', function(cb) {
    app.ask(function(err, answers) {
      if (err) return cb(err);
      app.answers(answers);

      var project = app.answers('project') || {};
      var name = app.answers('name') || project.name;
      if (name) {
        app.answers('varname', app.option('var') || namify(name));
        app.answers('alias', app.toAlias(name));
      }
      app.answers(merge({}, project));
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
