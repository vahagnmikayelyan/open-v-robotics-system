import EventEmitter from "events";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { IHardwareConnector } from "../types/types.js";

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
      console.log('UART port opened');
      this.emit('ready');
    });

    this.parser.on('data', (line) => {
      console.log(`[Pico RAW Log]: ${line}`);
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const json = JSON.parse(trimmed);
        this.handleMessage(json);
      } catch (e) {
        // Logs non-JSON output (like print statements from your Pico)
        console.log(`[Pico Log]: ${trimmed}`);
      }
    });

    this.port.on('close', () => {
      console.warn('UART port closed');
      // Reject all pending promises so the app doesn't hang
      for (const [id, handler] of this.handlers) {
        handler.reject(new Error(`Port closed. Command ${id} cancelled.`));
      }
      this.handlers.clear();
    });

    this.port.on('error', (err) => {
      console.error('[UART] Error:', err.message);
    });
  }

  init() {
    if (this.port.isOpen || this.port.opening) return;

    this.port.open((err) => {
      if (err) {
        console.error('[UART] Open Fail: ', err.message);
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

      console.log('[UART] Send command', payload);

      this.port.write(payload, (err) => {
        if (err) {
          console.error(`[UART] Write Error for ID ${id}:`, err.message);
          this.handlers.delete(id);
          reject(err);
        } else {
          console.log(`[UART] Sent ID ${id}`);
        }
      });
    });
  }

  private handleMessage(message: any) {
    if (message.i === undefined) {
      console.warn('[UART] Received message without ID:', message);
      return;
    }

    const handler = this.handlers.get(message.i);
    if (handler) {

      if (message.s === 'processing') {
        console.log(`Command ${message.i} is still running...`);
        return; // Don't resolve yet
      }

      this.handlers.delete(message.i);
      handler.resolve({ ...message, module: handler.module, action: handler.action });
    }
  }
}

export default PicoUartConnector;
