/** 
 * This file will house the functions necessary for setting up
 * liveQL on the server. Any configurations should be passed into
 * this function.
 *
 * This could also be the place where we create the function that wraps
 * the server with WebSockets.
 */

const sio = require('socket.io');

// REMOVE ME
// You'll be passed in three paremters now from the RDL.  
// Maybe remove this.
const rdl = require('./reactiveDataLayer');
const { graphql } = require('graphql');

const liveServer = {};


/**
 * Function below matches the signature of what we need.
 */

/**
 * This function fires after the resolution of a GraphQL query.
 * 
 * @param {Object} response - The GraphQL response to be sent back to the client.
 * @param {Object} queue - The queue of users that need to be notified of changes.
 * @param {String} handle - The handle of the client. Needs to be passed back in the response.
 */
module.exports = (response, queue, handle) => {
	console.log('after');
  // If a handle was passed in the client needs it as part of the response.
  // This will be what they listen for on the client.
	if (handle) response.handle = handle;
	// Testing
	console.log(response);
	// There's nothing in the queue ATM.
	if (!queue) return response;
	// Loop over queue, run query, and send response. 
	return response;
};

liveServer.io = null;

liveServer.instatiateIO = function () {
	return liveServer.io;
};


liveServer.initialize =  (server) => {
	liveServer.io = sio(server);

	liveServer.io.on('connection', function (socket) {
		socket.on('unload', function (data) {
			data.forEach(handle => {
				rdl.subscriptions[handle].subscribers--;
			});
		});
	});
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

liveServer.emit = (schema) => {
	for (hashKey in rdl.queue) {
		const query = async (rdlHash, hashKey) => {
			graphql(schema, rdlHash.query)
				.then(data => {
					liveServer.io.sockets.emit(hashKey, data)
				})
		}
		query(rdl.subscriptions[hashKey], hashKey)
	}
}


// Only need the one function that takes the GraphQL response.
// module.exports = liveServer;

