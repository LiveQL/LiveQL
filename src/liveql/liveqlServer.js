
const liveConfig = require('./liveqlConfig');
const { afterQuery } = require('./liveqlSocket');
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

    // Boolean that indicates if this is a mutation.
    liveqlObj.context.__live.mutation = res.locals.mutation;

    // In the event of a mutation, subscribers will be added to this queue.
    res.locals.queue = [];
    liveqlObj.context.__live.queue = res.locals.queue;
    // If the user is already using the formatResponse function.
    if (liveqlObj.formatResponse) {
      // There's already a function defined in formatResponse.
      const fn = liveqlObj.formatResponse;
      liveqlObj.formatResponse = (val) => {
        // Check if this is a live query and add the handle to response.
        if (liveqlObj.context.__live.handle) {
          val.handle = liveqlObj.context.__live.handle;
        };
        // Pass the queue and the hashed query to the formatResponse function.
        afterQuery(res.locals.queue);
        return fn(val);
      };
    } else {
      liveqlObj.formatResponse = (val) => {
        if (liveqlObj.context.__live.handle) {
          val.handle = liveqlObj.context.__live.handle;
        }
        afterQuery(res.locals.queue);
        return val;
      };
    }
    return graphqlExpress(liveqlObj)(req, res, next);
  };
};
