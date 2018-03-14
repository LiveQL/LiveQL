const { queue } = require('./reactiveDataLayer');
const queryHash = require('./queryHash');

/**
 * This function creates a "hash" of a GraphQL query that is used as a WebSocket
 * identifier. It stores that "hash" with the query string in an object that is used
 * to subscribe to data and reply when data is changed.
 *
 * @param {req} req - Express req object. req.body.query stores the GraphQL query string.
 * @param {*} res - Express res object.
 * @param {*} next - Express next function
 */
module.exports = (req, res, next) => {
  let { query } = req.body;
  if (!query) return next();
  query = query.trim();

  const { variables } = req.body;
  const open = query.indexOf('{');

  // This is a not a query, so it cannot subscribe to data
  if (open !== 0 && !query.slice(0, open).includes('query')) return next();

  /**
   * THIS ASSUMES THE DIRECTIVE IS CALLED @live.
   * If we're going to change this we need to get a name at the point
   * of config and look for it here.
   */
  if (!query.slice(0, open).includes('@live')) return next();
  // Get hash of query
  const hash = queryHash(query, variables);

  queue[hash] = { query, variables };
  res.locals.handle = hash;
  return next();
};
