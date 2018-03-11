const RDL = require('./reactiveDataLayer');

/**
 * This function checks the notification queue for subscribers that
 * need to be notified. If the queue contains subscribers, the query
 * linked to the subscriber is run and the result is emitted to that
 * websocket handle.
 * @param {String} response 
 */
module.exports = (response) => {
  // if RDL.queue has people do stuff
};
