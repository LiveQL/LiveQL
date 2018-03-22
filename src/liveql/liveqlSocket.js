/**
 * This file contains the functions needed for handling WebSockets
 * on the server.
 *
 */

const sio = require('socket.io');
const rdl = require('./reactiveDataLayer');
const { graphql } = require('graphql');
const { uid } = require('./liveqlConfig').get();

const liveSocket = {};
liveSocket.io = null;

// Store the schema in the liveSocket object.
liveSocket.schema = null;


liveSocket.instatiateIO = () => liveSocket.io;

/**
 * This function sets up the socket.io server.
 * @param {Object} server - The HTTP server object.
 * @param {Object} schema - The GraphQL schema object.
 */
liveSocket.initialize = (server, schema) => {
  liveSocket.schema = schema;
  liveSocket.io = sio(server);
  // Decrement subscribers on disconnect
  liveSocket.io.on('connection', (socket) => {
    socket.on('unload', (data) => {
      data.forEach((handle) => {
        rdl.subscriptions[handle].subscribers -= 1;
      });
    });
  });
};

/**
 * This function fires after the resolution of a GraphQL query.
 * @param {Object} queue - The queue of users that need to be notified of changes.
 * @param {Boolean} mutation - This will be set to true if data was mutated.
 */
function afterQuery(queue, mutation) {
  if (!mutation) return;
  const handles = Object.keys(Object.assign({}, ...queue));
  handles.forEach((handle) => {
    if (rdl.subscriptions[handle]) {
      const { query, vars } = rdl.subscriptions[handle];
      const context = { __live: { handle, uid } };
      graphql(liveSocket.schema, query, null, context, vars).then((result) => {
        liveSocket.io.sockets.emit(handle, result.data);
      });
    }
  });
}

module.exports = { afterQuery, liveqlSocket: liveSocket.initialize };
