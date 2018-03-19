
const liveConfig = require('./liveqlConfig');
const post = require('./afterResolution');
const { graphqlExpress } = require('apollo-server-express');

/**
 * This function wraps around the graphqlExpress function. It creates a GraphQL HTTP server
 * with modifications to the context and formatResponse field.
 *
 * @param {Object} graphqlObj - The config object that is required for graphqlExpress.
 */
module.exports = (graphqlObj) => {
  // Grab the LiveQL config object.
  let settings = liveConfig.get();

  // If there are no LiveQL settings, call set() to set defaults.
  if (!settings.uid) settings = liveConfig.set();
  const liveqlObj = { ...graphqlObj };

  return (req, res, next) => {
    if (!liveqlObj.context) {
      liveqlObj.context = {};
    }
    // Set the context object for the directive resolver.
    liveqlObj.context.__live = {};

    // The handle for a query is stored in res.locals.handle.
    liveqlObj.context.__live.handle = res.locals.handle;
    liveqlObj.context.__live.uid = settings.uid;
    liveqlObj.context.__live.directive = settings.directive;

    // In the event of a mutation, subscribers will be added to this queue.
    liveqlObj.context.__live.queue = res.locals.queue;
    // If the user is already using the formatResponse function.
    if (liveqlObj.formatResponse) {
      // There's already a function defined in formatResponse.
      const fn = liveqlObj.formatResponse;
      liveqlObj.formatResponse = (val) => {
        // Pass the queue into the post function. Might need to pass in the handle as well
        // so that it can attach the handle to the response.
        post(val, res.locals.queue);
        return fn(val);
      };
    } else {
      liveqlObj.formatResponse = val => post(val);
    }
    return graphqlExpress(liveqlObj)(req, res, next);
  };
};
