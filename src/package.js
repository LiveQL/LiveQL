// Object with get and set methods.
const liveqlConfig = require('./liveql/liveqlConfig');

// Function that sets up LiveQL server.
const liveqlServer = require('./liveql/liveqlServer');

// Express middleware that processes incoming queries.
const liveqlProcess = require('./liveql/liveqlProcess');

// Live resolver function.
const liveqlResolver = require('./liveql/liveqlResolver');

// Client functions.
const liveqlClient = require('./liveql/liveqlClient');

// Server socket setup function.
const { liveqlSocket } = require('./liveql/liveqlSocket');

module.exports = { liveqlConfig, liveqlServer, liveqlProcess, liveqlResolver, liveqlClient, liveqlSocket };

