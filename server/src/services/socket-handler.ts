import type { Server } from 'node:http';
import { IModuleController } from '../types/hardware.js';
import { WebSocketServer } from 'ws';
import Socket from './socket.js';
import { Logger } from './logger.js';
import { ISystemController } from '../types/system.js';
import { IProgram } from '../types/program.js';

interface ICommand {
  module: string;
  command: string;
  params: Record<string, unknown>;
}

const SocketHandler = (server: Server, moduleController: IModuleController, systemController: ISystemController) => {
  const wss = new WebSocketServer({ clientTracking: false, noServer: true, path: '/socket' });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws) => {
    const socket = new Socket(ws);

    const init = () => {
      Logger.debugLog('Socket instance connected', 'Socket');
      socket.emit('init');
    };

    moduleController.modules['camera'].on('frame', (frame: Buffer) => {
      socket.emit('cameraData', 'data:image/jpg;base64,' + frame.toString('base64'));
    });

    moduleController.on('moduleEvent', (data: { module: string; command: string; params: Record<string, unknown> }) => {
      socket.emit('moduleEvent', data);
    });

    moduleController.on('systemError', (message: string) => {
      socket.emit('systemError', message);
    });

    systemController.on('AISystemMessage', (message: string) => {
      socket.emit('aiMessage', message);
    });

    systemController.on('AITextMessage', (message: string) => {
      socket.emit('aiMessage', message);
    });

    systemController.on('programChange', (state: IProgram) => {
      socket.emit('programChange', state);
    });

    systemController.on('systemError', (message: string) => {
      socket.emit('systemError', message);
    });

    socket.on<ICommand>('command', ({ module, command, params }) => {
      // ToDo need optimization and standardization for all modules
      if (module === 'camera') {
        moduleController.runCommand(module, command, params);
      } else {
        moduleController
          .runCommand(module, command, params)
          .then((response: unknown) => {
            response && socket.emit('commandResult', response);
          })
          .catch((err: Error) => {
            socket.emit('commandError', { module, command, error: err.message });
          });
      }
    });

    socket.on<number>('runProgram', (programId) => {
      systemController.runProgram(programId);
    });

    socket.on('getRunningProgram', () => {
      socket.emit('programChange', systemController.getRunningProgram());
    });

    socket.on('stopRunningProgram', () => {
      systemController.stopRunningProgram();
    });

    socket.on<string>('message', (text) => {
      systemController.sendText(text);
    });

    socket.on('disconnect', () => {
      Logger.debugLog('Socket instance disconnect', 'Socket');
    });

    init();
  });
};

export default SocketHandler;
