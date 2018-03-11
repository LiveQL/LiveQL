const liveqlClient = require('./client/index');
const liveqlServer = require('./server/index');

/**
 * This will serve as the entry point for the npm module. When
 * someone require('liveql') they will get the export from this
 * file.
 */

module.exports = {
  liveqlClient,
  liveqlServer,
};
