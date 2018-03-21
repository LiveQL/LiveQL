/**
 * This file contains the functions needed to set LiveQL up
 * on the client.
 */

import SocketIOClient from 'socket.io-client';

const liveqlClient = {};

// Array of live socket handles.
liveqlClient.handles = [];

liveqlClient.connect = (endpoint) => {
  liveqlClient.socket = SocketIOClient.connect(endpoint);
  liveqlClient.windowUnload();
};

liveqlClient.windowUnload = () => {
  window.addEventListener('beforeunload', () => {
    liveqlClient.socket.emit('unload', liveqlClient.handles);
  });
};

liveqlClient.on = (socketHandler, callback) => {
  if (!liveqlClient.handles.includes(socketHandler)) {
    liveqlClient.handles.push(socketHandler);
    liveqlClient.socket.on(socketHandler, (data) => {
      // Callback function for manipulating GraphQL data.
      callback(data);
    });
  }
};

module.exports = liveqlClient;
