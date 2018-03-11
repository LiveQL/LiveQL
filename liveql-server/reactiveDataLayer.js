/**
 * This file creates the reactive data layer (RDL) object and methods for interacting with it.
 * The actually data store should not be a JS object, but for now we can develop it in this
 * file.
 */

const RDL = {};

// Data from query resolution will be stored in the store object.
RDL.store = {};

// -- UPDATE THESE COMMENTS! -- //

// Subscription data will be stored in the subscriptions object.
// The key should be the hash of the query and the value should
// store the entire query string. Maybe some more data. We may need
// to use a linked list to avoid collisions. Just a thought.
RDL.subscriptions = {};

// This will be the notification queue. It stores the list of WebSocket
// handle that need to be notified of changes. For now, we'll just rerun
// the entire query and return the result. There's room to improve.
RDL.queue = {};

module.exports = RDL;
