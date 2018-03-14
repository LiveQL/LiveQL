//web socket on mount stuff
import SocketIOClient from 'socket.io-client'

const liveClient = {};

//store of live socket handles.
liveClient.handles = [];

liveClient.connect = (endpoint) => {
	liveClient.socket = SocketIOClient.connect(endpoint);
	//invoking this for the developer right off the bat.
	liveClient.windowUnload();
}

liveClient.windowUnload = () => {
	window.addEventListener("beforeunload", function (event) {
		liveClient.socket.emit('unload', liveClient.handles)
	});
}

liveClient.on = (socketHandler, callback) => {
	if (!liveClient.handles.includes(socketHandler)) {
		liveClient.handles.push(socketHandler)
		liveClient.socket.on(socketHandler, (data) => {
			//the developer will pass in their callback for the data.
			callback(data);
		});
	}
}



module.exports = liveClient;