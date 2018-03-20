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

  // Check if this is a mutation.
  if (query.slice(0, open).includes('mutation')) {
    res.locals.mutation = true;
    return next();
  }
  res.locals.mutation = false;
  // This is a not a query, so it cannot subscribe to data.
  if (open !== 0 && !query.slice(0, open).includes('query')) return next();

  // Grab the direcive defined in the LiveQL settings.
  let config = liveConfig.get();
  if (!config.directive) config = liveConfig.set();
  const { directive } = config;
  if (!query.slice(0, open).includes(directive)) return next();

  // Get hash of query.
  const hash = queryHash(query, variables);

  // Regex to strip out directive.
  const reg = new RegExp(directive, 'g');

  // There's at least one subscriber on this query.
  if (subscriptions[hash]) {
    subscriptions[hash].listeners += 1;
  } else {
    query = query.replace(reg, '');
    subscriptions[hash] = { query, variables, listeners: 1 };
  }

  // Store the handle for this user in res.locals.handle.
  res.locals.handle = hash;
  // Strip directive from query.
  req.body.query = req.body.query.replace(reg, '');
  return next();
};

