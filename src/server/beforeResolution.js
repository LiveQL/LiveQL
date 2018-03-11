const RDL = require('./reactiveDataLayer');


/**
 * This function processes the query before the resolution begins. This is where
 * the WebSocket handle should be created from the hash of the query string. The
 * query string should be stored as the value.
 *
 * @param {Object} req - The express req object. Includes req.body.query.
 * @param {Object} res - The express res object.
 * @param {Function} next - Funciton to proceed to next middleware.
 */

// -- REMOVE ME -- //
// Need to find an efficient hash function to use and decide if how we're going
// to handle collisions.
module.exports = (req, res, next) => {
  // Preprocessing middleware goes here.
  // if req.body.query contains @live
  // RDL.subscription[hash(req.body.query)] = req.body.query
  // Need a way to pass that hash into the live resolvers
};

