const beforeResolution = require('./beforeResolution');
const liveResolver = require('./liveResolver');
const afterResolution = require('./afterResolution');

/**
 * LiveQL features should be developed in seperate files and imported into
 * index.js. Index.js will be the entry point for our library and should
 * export all the features needed to use LiveQL.
 */

module.exports = { beforeResolution, liveResolver, afterResolution };

