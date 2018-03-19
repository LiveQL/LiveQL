// Object with get and set methods.
const config = require('./liveql/liveqlConfig');

// Function that sets up LiveQL server.
const server = require('./liveql/liveqlServer');

// Express middleware that processes incoming queries.
const process = require('./liveql/processQuery');

// Live resolver function.
const liveResolver = require('./liveql/liveResolver');

// Client functions.
const client = require('./liveql/liveqlClient')

// ADD MORE FUNCTIONS!!!

/**
 * This will serve as the entry point for the npm module. When
 * someone require('liveql') they will get the export from this
 * file.
 */

module.exports = { config, server, process, liveResolver, client };

