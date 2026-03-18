import type { Server } from 'node:http';
import { IHardwareController } from '../types/types.js';
import { WebSocketServer } from 'ws';
import Socket from './socket.js';

interface ICommand {
  module: string;
  command: string;
  params: Record<string, unknown>;
}

const SocketHandler = (server: Server, hardwareConnector: IHardwareController) => {
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

    hardwareConnector.modules['camera'].on('frame', (frame: Buffer) => {
      socket.emit('cameraData', 'data:image/jpg;base64,' + frame.toString('base64'));
    });

    socket.on<ICommand>('command', ({ module, command, params }) => {
      // ToDo need optimization and standardization for all modules
      if (module === 'camera') {
        hardwareConnector.runCommand(module, command, params);
      } else {
        hardwareConnector.runCommand(module, command, params).then((response: unknown) => {
          response && socket.emit('commandResult', response);
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('socket instance disconnect');
    });

    init();
  });
};

export default SocketHandler;
