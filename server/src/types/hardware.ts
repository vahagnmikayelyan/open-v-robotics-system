import EventEmitter from 'events';

export interface IHardwareConnector extends EventEmitter {
  init(): void;
  sendCommand(moduleName: string, command: string, payload?: Record<string, unknown>): Promise<unknown>;
}
