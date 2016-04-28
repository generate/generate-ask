'use strict';

var argv = require('minimist')(process.argv.slice(2));
var debug = require('debug')('generate:ask');
var utils = require('./utils');

/**
 * Generic prompts for commonly used project data
 */

module.exports = function(app, base) {
  if (!app.isApp || app.isRegistered('generate-ask')) return;
  debug('initializing <%s>, from <%s>', __filename, module.parent.id);

  app.questions.use(utils.match());

  /**
   * Clear all cached questions and answers
   */

  app.task('clear', function(cb) {
    base.questions.clear();
    cb();
  });

  /**
   * Author data
   */

  app.task('author', function(cb) {
    authorQuestions(base);
    app.build('ask', cb);
  });

  /**
   * Project data
   */

  app.task('project', function(cb) {
    projectQuestions(base);
    app.build('ask', cb);
  });

  /**
   * Ask questions
   */

  app.task('ask', { silent: true }, function(cb) {
    app.data(base.cache.data);
    app.option(base.options);

    base.ask(function(err, answers) {
      if (err) return cb(err);
      setNames(app, base, answers);
      cb();
    });
  });

  /**
   * Default task
   */

  app.task('default', { silent: true }, ['author', 'project', 'ask']);
};

function authorQuestions(app, config) {
  var options = utils.merge({ global: true }, config);
  app.question('author.name', 'Author\'s name?', options);
  app.question('author.username', 'Author\'s GitHub username?', options);
  app.question('author.twitter', 'Author\'s twitter username?', options);
  app.question('author.email', 'Author\'s email address?', options);
  app.question('author.url', 'Author\'s URL?', options);
}

function projectQuestions(app, config) {
  app.question('project.name', 'Project name?', {
    default: app.project,
    force: true
  });

  app.question('project.description', 'Project description?', {
    default: app.pkg.get('description'),
    force: true
  });

  app.question('project.version', 'Project version?', {
    default: app.pkg.get('version') || '0.1.0',
    force: true
  });

  app.question('project.owner', 'Project owner?', {
    default: owner(app, app.pkg.get('repository')),
    force: true
  });
}

/**
 * Get `varname` and `alias` from project name
 */

function setNames(app, base, answers) {
  var name = base.project || answers.name || answers.project.name;
  answers = answers || {};
  answers.name = name;
  if (answers.name) {
    answers.varname = base.options.var || utils.namify(answers.name);
    answers.alias = base.toAlias(answers.name);
  }

  base.data(answers);
  base.data(answers.project);
  app.data(base.cache.data);
  return answers;
}

/**
 * Create `owner` variable for templates context
 */

function owner(app, repo) {
  if (utils.isObject(repo)) {
    repo = repo.url;
  }
  if (typeof repo === 'string') {
    var obj = utils.parseGithubUrl(repo);
    return obj.owner;
  }
  return app.data('author.username');
}

/**
 * Expose questions
 */

module.exports.author = authorQuestions;
module.exports.project = projectQuestions;
