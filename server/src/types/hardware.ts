import EventEmitter from 'events';

export interface IHardwareConnector extends EventEmitter {
  init(): void;
  sendCommand(moduleName: string, command: string, payload?: Record<string, unknown>): Promise<unknown>;
}

export interface IModuleController {
  modules: Record<string, any>;
  setActiveProgramConfigs(configs: Record<string, unknown>): void;
  runCommand(moduleName: string, command: string, payload?: Record<string, unknown>): Promise<unknown>;
  on(event: string, listener: (...args: any[]) => void): this;
}
