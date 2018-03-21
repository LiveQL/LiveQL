
const liveConfig = require('./liveqlConfig');
const { afterQuery } = require('./liveqlSocket');
const { graphqlExpress } = require('apollo-server-express');

/**
 * This function wraps around the graphqlExpress function. It creates a GraphQL HTTP server
 * with modifications to the context and formatResponse field.
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

    /**
     * Add a check here to see if the formatResponse property already has a function.
     * Make it so that it can call that function after the afterQuery function.
     */
    liveqlObj.formatResponse = (val) => {
      if (liveqlObj.context.__live.handle) {
        val.handle = liveqlObj.context.__live.handle;
      }
      afterQuery(res.locals.queue, res.locals.mutation);
      return val;
    };

    return graphqlExpress(liveqlObj)(req, res, next);
  };
};
