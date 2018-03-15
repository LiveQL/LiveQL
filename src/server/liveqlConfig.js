/**
  * LiveQL Config Object:
  *  {
  *    uid: {String | Optional} - The string of the unique identifer that is returned for live objects (ex: 'live_id'). Default is 'id'.
  *    directive: {String | Optional} - The string of the directive identifier (ex: @live). Just pass in the part after the @. Default is 'live'.
  *    retrieve: {Function | Optional} - A function that retrieves the RDL.
  *    deploy: {Function | Optional} - A function that deploys the RDL.
  *  }
*/

const liveql = {};

// Store the default settings.
liveql.default = { uid: 'id', directive: 'live' };

// Store the LiveQL server settings.
liveql.config = {};

/**
 * This function sets the LiveQL config object.
 * @param {Object} settings - User settings object.
 * @returns {Object} - LiveQL settings object.
 */
liveql.setLiveConfig = (settings) => {
  if (!settings) {
    liveql.config.uid = 'id';
    liveql.config.directive = '@live';
  } else {
    liveql.config.uid = settings.uid || liveql.default.uid;

    // Add the @ sign to the directive if one is passed in the object.
    if (settings.directive) {
      // User included @ in front of directive.
      if (settings.directive.indexOf('@') === 0) {
        liveql.config.directive = settings.directive;
      } else {
        liveql.config.directive = '@' + settings.directive;
      }
    }
    if (settings.retrieve) liveql.config.retrieve = settings.retrieve;
    if (settings.deploy) liveql.config.deploy = settings.deploy;
  }
  return liveql.config;
};

// Return the config object.
liveql.getLiveConfig = () => liveql.config;

module.exports = { setConfig: liveql.setLiveConfig, getConfig: liveql.getLiveConfig };

