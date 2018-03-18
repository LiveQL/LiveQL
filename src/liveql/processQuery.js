const { subscriptions } = require('./reactiveDataLayer');
const queryHash = require('./queryHash');
const liveConfig = require('./liveqlConfig');

/**
 * This function creates a "hash" of a GraphQL query that is used as a WebSocket channel
 * identifier. It stores that "hash" with the query string in an object that is used
 * to subscribe to data during the resolution process.
 *
 * @param {Object} req - Express req object.
 * @param {Object} res - Express res object.
 * @param {Function} next - Express next function.
 */
module.exports = (req, res, next) => {
  let { query } = req.body;
  if (!query) return next();
  query = query.trim();
  const { variables } = req.body;
  const open = query.indexOf('{');

  // This is a not a query, so it cannot subscribe to data.
  if (open !== 0 && !query.slice(0, open).includes('query')) return next();

  // Grab the direcive defined in the LiveQL settings.
  const { directive } = liveConfig.get();
  if (!query.slice(0, open).includes(directive)) return next();

  // Get hash of query.
  const hash = queryHash(query, variables);

  // There's at least one subscriber on this query.
  if (subscriptions[hash]) {
    subscriptions[hash].listeners += 1;
  } else {
    subscriptions[hash] = { query, variables, listeners: 1 };
  }

  // Store the handle for this user in res.locals.handle.
  res.locals.handle = hash;

  return next();
};

