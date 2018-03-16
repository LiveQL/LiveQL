/**
  * LiveQL Config Object:
  *  {
  *    uid: {String | Optional} - The string of the unique identifer that is returned for live objects (ex: 'live_id'). Default is 'id'.
  *    directive: {String | Optional} - The string of the directive identifier (ex: @live). Just pass in the part after the @. Default is 'live'.
  *    retrieve: {Function | Optional} - A function that retrieves the RDL.
  *    deploy: {Function | Optional} - A function that deploys the RDL.
  *  }
*/

const liveConfig = {};

// Store the default settings.
liveConfig.default = { uid: 'id', directive: 'live' };

// Store the LiveQL server settings.
liveConfig.config = {};

/**
 * This function sets the LiveQL config object.
 * @param {Object} settings - User settings object.
 * @returns {Object} - LiveQL settings object.
 */
liveConfig.set = (settings) => {
  if (!settings) {
    liveConfig.config.uid = 'id';
    liveConfig.config.directive = '@live';
  } else {
    liveConfig.config.uid = settings.uid || liveConfig.default.uid;

    // Add the @ sign to the directive if one is passed in the object.
    if (settings.directive) {
      // User included @ in front of directive.
      if (settings.directive.indexOf('@') === 0) {
        liveConfig.config.directive = settings.directive;
      } else {
        liveConfig.config.directive = '@' + settings.directive;
      }
    }
    if (settings.retrieve) liveConfig.config.retrieve = settings.retrieve;
    if (settings.deploy) liveConfig.config.deploy = settings.deploy;
  }
  return liveConfig.config;
};

// Return the config object.
liveConfig.get = () => liveConfig.config;

module.exports = { set: liveConfig.set, get: liveConfig.get };

