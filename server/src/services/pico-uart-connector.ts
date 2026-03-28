import EventEmitter from 'events';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { IHardwareConnector } from '../types/hardware.js';
import { Logger } from './logger.js';

class PicoUartConnector extends EventEmitter implements IHardwareConnector {
  private messageId: number = 0;
  private handlers: Map<number, any> = new Map();
  private port: SerialPort;
  private parser: ReadlineParser;

  constructor(path = '/dev/ttyAMA0', baudRate = 115200) {
    super();

    this.port = new SerialPort({ path: path, baudRate: baudRate, autoOpen: false });
    this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

    this.setupListeners();
  }

  private setupListeners() {
    this.port.on('open', () => {
      Logger.debugLog('Port opened', 'UART');
      this.emit('ready');
    });

    this.parser.on('data', (line) => {
      Logger.debugLog('RAW log', 'UART', line);
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const json = JSON.parse(trimmed);
        this.handleMessage(json);
      } catch (e) {
        // Logs non-JSON output (like print statements from your Pico)
        Logger.debugLog(`Error in parsing command - ${trimmed}`, 'UART');
      }
    });

    this.port.on('close', () => {
      Logger.debugLog('Port closed', 'UART');
      // Reject all pending promises so the app doesn't hang
      for (const [id, handler] of this.handlers) {
        handler.reject(new Error(`Port closed. Command ${id} cancelled.`));
      }
      this.handlers.clear();
    });

    this.port.on('error', (err) => {
      Logger.errorLog(`Error -  ${err.message}`, 'UART');
    });
  }

  init() {
    if (this.port.isOpen || this.port.opening) return;

    this.port.open((err) => {
      if (err) {
        Logger.errorLog(`Port open fail -  ${err.message}`, 'UART');
      }
    });
  }

  sendCommand(module: string, action: string, params = {}) {
    if (!this.port.isOpen) {
      return Promise.reject(new Error('UART port is not open'));
    }

    const id = this.messageId++;
    const payload = JSON.stringify({ i: id, m: module, a: action, ...params }) + '\n';

    return new Promise((resolve, reject) => {
      this.handlers.set(id, { resolve, reject, module, action });

      Logger.debugLog(`Send command - ${payload}`, 'UART');

      this.port.write(payload, (err) => {
        if (err) {
          Logger.errorLog(`Write Error for ID ${id}:`, 'UART', err.message);
          this.handlers.delete(id);
          reject(err);
        }
      });
    });
  }

  private handleMessage(message: any) {
    if (message.i === undefined) {
      Logger.errorLog('Received message without ID', 'UART', message);
      return;
    }

    const handler = this.handlers.get(message.i);
    if (handler) {
      if (message.s === 'processing') {
        Logger.debugLog(`Command ${message.i} is still running...`, 'UART');
        return; // Don't resolve yet
      }

      this.handlers.delete(message.i);
      handler.resolve({ ...message, module: handler.module, action: handler.action });
    }
  }
}

export default PicoUartConnector;
