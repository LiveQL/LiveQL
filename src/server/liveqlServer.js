const graphqlHTTP = require('express-graphql');
const liveConfig = require('./liveqlConfig');
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
 */
module.exports = (graphqlObj) => {
  // Add the uid, directive, 
  // Context zone!
  /**
   * context.__live = {
   *  handle - hash of query
   *  uid - 'id'
   *  directive - '@live'
   *  firstRun - True (is this the first time running?)
   * }
   */
  const liveqlSettings = liveConfig.get();
  const liveqlObj = { ...graphqlObj };

  // If the user didn't pass in the context object. This could be a 
  // time to check the liveqlSettings object for noCtx. 

  return (req, res, next) => {
    if (!liveqlObj.context) {
      liveqlObj.context = {};
    }
    liveqlObj.context.__live = {};
    liveqlObj.context.__live.handle = res.locals.handle;
    liveqlObj.context.__live.uid = liveqlSettings.uid;
    liveqlObj.context.__live.directive = liveqlSettings.directive;
    liveqlObj.context.__live.firstRun = true;
    
    if (liveObj.extensions) {
      // Handle the case where they have an extension definied. 
      // Higher order functions, bro.
    } else {
      liveObj.extensions = () => console.log('sup');
    }
    return graphqlHTTP(liveqlObj)(req, res, next);
};