'use strict';

var merge = require('mixin-deep');
var questions = require('base-questions');
var namify = require('namify');

module.exports = function(app, base) {
  app.use(questions(base.options));
  app.option(base.options);

  app.task('init', function(cb) {
    setup(app);
    app.questions.clear();
    app.questions
      .set('init.intro', 'Would you like to disable the intro next time?')
      .set('init.tasks', 'Would you like to set default tasks to run?')
      .set('init.flags', 'Do you want to disable tasks when non-task flags are passed on argv (like `--set=foo`)?');
    app.build('ask', cb);
  });

  app.task('author', function(cb) {
    setup(app);
    app.questions.clear();
    app.questions
      .set('author.name', 'Author\'s name?')
      .set('author.github', 'Author\'s GitHub username?')
      .set('author.twitter', 'Author\'s twitter username?')
      .set('author.email', 'Author\'s email address?')
      .set('author.url', 'Author\'s URL?');
    app.build('ask', cb);
  });

  app.task('project', function(cb) {
    app.questions.clear();
    app.questions
      .set('project.name', 'Project name?')
      .set('project.description', 'Project description?')
    app.build('ask', cb);
  });

  app.task('ask', function(cb) {
    setup(app);

    app.ask(function(err, answers) {
      if (err) return cb(err);

      var project = app.get('answers.project');
      var name = app.get('answers.name');
      if (name) {
        answers.varname = app.option('var') || namify(name);
        answers.alias = app.toAlias(name);
      }

      var project = merge({}, answers.project);
      app.data(project);
      app.data(answers);
      cb();
    });
  });

  app.task('default', ['ask']);
};

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
      if (val === ' ()') {
        question.answer.del();
        return;
      }
      if (key.indexOf('author') === 0 && val) {
        question.answer.setDefault(key, val);
        // app.store.set(key, val);
      }
    }
  }

function toAlias(name) {
  return name.slice(name.lastIndexOf('-') + 1);
}
