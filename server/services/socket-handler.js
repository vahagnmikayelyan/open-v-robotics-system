import { WebSocketServer } from 'ws';
import Socket from './socket.js';

const SocketHandler = (server, hardwareConnector) => {

	const wss = new WebSocketServer({ clientTracking: false, noServer: true, path: '/socket' });

	server.on('upgrade', (request, socket, head) => {
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit('connection', ws, request);
		});
	});

    wss.on('connection', (ws) => {

		const socket = new Socket(ws);

		const init = () => {
			console.log('Socket instance connected');
			socket.emit('init');
		};

		socket.on('command', ({ module, command, params }) => {
			hardwareConnector.runCommand(module, command, params).then((response) => {
				response && socket.emit('commandResult', response);
			});
		});

        socket.on('disconnect', () => {
            console.log('socket instance disconnect');
        });

		init();
    });
};

export default SocketHandler;