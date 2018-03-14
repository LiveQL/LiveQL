const graphqlHTTP = require('express-graphql');
// const handle = require('...')

/**
 * LiveQL Config Object:
 * {
 *  uniqueId: {String | Optional} - The string of the unique identifer that is returned for live objects (ex: 'live_id'). Default is 'id'.
 *  directive: {String | Optional} - The string of the directive identifier (ex: @live). Just pass in the part after the @. Default is 'live'.
 *  noContext: {Boolean | Optional} - Set to true if you intentionally left the context blank so that the req object is passed.
 *  retrieve: {Function | Optional} - A function that retrieves the RDL.
 *  deploy: {Function | Optional} - A function that deploys the RDL.
 * } 
 */

/**
 * This function wraps around the graphqlHTTP function. It creates a GraphQL HTTP server
 * with modifications to the context and extensions field.
 *
 * @param {Object} graphqlConfig - The config object that is required for graphqlHTTP.
 * @param {Object} liveqlConfig - The LiveQL config object.
 */
module.exports = (graphqlConfig) => {
  // Server function
  // Context zone!
  // return (req, res) => {
    
    // return graphqlHTTP()(req, res);
  }
  // 
};