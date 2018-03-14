/**
  * LiveQL Config Object:
  *  {
  *    uid: {String | Optional} - The string of the unique identifer that is returned for live objects (ex: 'live_id'). Default is 'id'.
  *    dirStr: {String | Optional} - The string of the directive identifier (ex: @live). Just pass in the part after the @. Default is 'live'.
  *    noCtx: {Boolean | Optional} - Set to true if you intentionally left the context blank so that the req object is passed.
  *    retrieve: {Function | Optional} - A function that retrieves the RDL.
  *    deploy: {Function | Optional} - A function that deploys the RDL.
  *  }
*/

const liveql = {};

// Store the default settings.
liveql.default = { uid: 'id', dirStr: 'live' };

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
    liveql.config.dirStr = '@live';
  } else {
    liveql.config.uid = settings.uid || liveql.default.uid;

    // Add the @ sign to the directive if one is passed in the object.
    if (settings.dirStr) {
      // User included @ in front of directive.
      if (settings.dirStr.indexOf('@') === 0) {
        liveql.config.dirStr = settings.dirStr;
      } else {
        liveql.config.dirStr = '@' + settings.dirStr;
      }
    }
    if (settings.noCtx) liveql.config.noCtx = settings.noCtx;
    if (settings.retrieve) liveql.config.retrieve = settings.retrieve;
    if (settings.deploy) liveql.config.deploy = settings.deploy;
  }
  return liveql.config;
};

// Return the config object.
liveql.getLiveConfig = () => liveql.config;

module.exports = { setConfig: liveql.setLiveConfig, getConfig: liveql.getLiveConfig };

