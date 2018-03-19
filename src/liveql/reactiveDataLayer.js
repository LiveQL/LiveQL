/**
 * This file creates the reactive data layer (RDL) object and the subscribers object.
 */

const RDL = {};

// Data from query resolution will be stored in the store object.
RDL.store = {};

// Subscription data will be stored in the subscriptions object.
// The key should be the hash of the query and the value should
// store the entire query string with the number of subscribers.
RDL.subscriptions = {};

module.exports = RDL;
