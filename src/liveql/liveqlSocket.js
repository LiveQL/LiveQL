/** 
 * This file will house the functions necessary for setting up liveQL on
 * the server. Any configurations should be passed into this function.
 *
 */

const sio = require('socket.io');
const rdl = require('./reactiveDataLayer');
const { graphql } = require('graphql');

const liveSocket = {};
liveSocket.io = null;

// Store the schema in the liveSocket object.
liveSocket.schema = null;


liveSocket.instatiateIO = () => liveSocket.io;

// Initialize Socket.io server. Require that the
// user passes in the GraphQL schema.
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

// liveSocket.emit = (schema) => {
// Loop over new queue; 
// for (hashKey in rdl.queue) {
// 	const query = async (rdlHash, hashKey) => {
// 		graphql(schema, rdlHash.query)
// 			.then(data => {
// 				liveSocket.io.sockets.emit(hashKey, data)
// 			})
// 	}
// 	query(rdl.subscriptions[hashKey], hashKey)
// }
// }

/**
 * This function fires after the resolution of a GraphQL query.
 * @param {Object} queue - The queue of users that need to be notified of changes.
 * @param {Boolean} mutation - This will be set to true if data was mutated.
 */
function afterQuery(queue, mutation) {
  if (!mutation) return;
  const handles = Object.keys(Object.assign({}, ...queue));
  handles.forEach((handle) => {
    const { query, vars } = rdl.subscriptions[handle];
    graphql(liveSocket.schema, query, null, {}, vars).then((result) => {
      console.log('data', result.data);
      // EMIT DATA TO CLIENT HERE!
    });
  });
}

module.exports = { afterQuery, liveqlSocket: liveSocket.initialize };
