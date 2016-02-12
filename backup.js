'use strict';

var namify = require('namify');

module.exports = function(app, base) {

  app.task('intro', function(cb) {
    app.questions
      .set('init.intro', 'Would you like to disable the intro next time?')
      .set('init.tasks', 'Would you like to set default tasks to run?')
    cb();
  });

  app.task('ask', function(cb) {
    app.questions.setData(app.store.data);
    app.questions.setData(app.pkg.data);

    app.questions.on('ask', function(name, question) {
      if (name.indexOf('author') !== 0) {
        question.force();
      } else {
        question.answer.set(app.store.get(name));
      }
    });

    app.questions.on('answer', function(key, val, question) {
      if (key.indexOf('author') === 0) {
        question.answer.setDefault(key, val);
        app.store.set(key, val);
      }
    });

    app.ask(function(err, answers) {
      if (err) return cb(err);
      if (answers.name) {
        answers.varname = base.option('var') || namify(answers.name);
        answers.alias = toAlias(answers.name);
      }
      app.store.set(answers);
      app.data({answers: answers});
      cb();
    });
  });

  app.task('default', ['ask']);
};

function toAlias(name) {
  return name.slice(name.lastIndexOf('-') + 1);
}
