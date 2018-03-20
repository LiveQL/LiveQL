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

liveSocket.emit = (schema) => {
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
}

//we built this emit function based on the assumption
//that max and andrew were decent developers
//and structured the rdl like this: 	hashedOneQuery: {
// RDL.subscriptions = {
// 	hashedTwoQuery: {
// 		query: "query { getAllTopics { _id topic }}",
// 		subscribers: 30
// 	}
// };


/**
 * NEEDS:
 * We need a function that process the queue and sends the updates back the subscribers
 * We need a function that creates the WebSocket server.
 */

/**
 * This function fires after the resolution of a GraphQL query.
 * 
 * @param {Object} response - The GraphQL response to be sent back to the client.
 * @param {Object} queue - The queue of users that need to be notified of changes.
 * @param {String} handle - The handle of the client. Needs to be passed back in the response.
 */

function afterQuery(queue) {
	console.log(queue);
	return;
}
module.exports = { afterQuery, liveqlSocket: liveSocket.initialize };
