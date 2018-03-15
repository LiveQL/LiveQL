// Object with get and set methods.
const config = require('./server/liveqlConfig');

// Function that sets up LiveQL server.
const server = require('./server/liveqlServer');

// Express middleware that processes incoming queries.
const process = require('./server/processQuery');

// ADD MORE FUNCTIONS!!!

/**
 * This will serve as the entry point for the npm module. When
 * someone require('liveql') they will get the export from this
 * file.
 */

module.exports = { config, server, process };
