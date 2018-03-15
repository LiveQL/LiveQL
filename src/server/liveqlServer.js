const graphqlHTTP = require('express-graphql');
const liveConfig = require('./liveqlConfig');
/**
 * LiveQL Config Object:
 * {
 *  uid: {String | Optional} - The string of the unique identifer that is returned for live objects (ex: 'live_id'). Default is 'id'.
 *  directive: {String | Optional} - The string of the directive identifier (ex: @live). Just pass in the part after the @. Default is 'live'.
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
  // Grab the LiveQL config object.
  const liveqlSettings = liveConfig.get();
  const liveqlObj = { ...graphqlObj };

  return (req, res, next) => {
    if (!liveqlObj.context) {
      liveqlObj.context = {};
    }
    liveqlObj.context.__live = {};
    liveqlObj.context.__live.handle = res.locals.handle;
    liveqlObj.context.__live.uid = liveqlSettings.uid;
    liveqlObj.context.__live.directive = liveqlSettings.directive;
    liveqlObj.context.__live.firstRun = true;
    if (liveqlObj.extensions) {
      // There's a function defined in extensions.
      const fn = liveqlObj.extensions;
      liveqlObj.extensions = (val) => {
        // Run the afterResolution.js.
        return fn(val);
      };
    } else {
      liveqlObj.extensions = () => console.log('Put afterResolution.js here.');
    }
    return graphqlHTTP(liveqlObj)(req, res, next);
  };
};