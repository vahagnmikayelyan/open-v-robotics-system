import EventEmitter from 'events';
import { IHardwareConnector, IModuleController } from '../types/hardware.js';
import { IModuleDeps } from '../types/module.js';
import { moduleRegistry } from '../modules/module-registry.js';
import PicoUartConnector from './pico-uart-connector.js';
import { Logger } from './logger.js';

class ModuleController extends EventEmitter implements IModuleController {
  private readonly picoConnector: IHardwareConnector;
  modules: Record<string, any>;

  constructor() {
    super();

    this.picoConnector = new PicoUartConnector();
    this.modules = {};

    for (const def of moduleRegistry) {
      const deps: IModuleDeps = {
        moduleId: def.id,
        picoConnector: this.picoConnector,
        getConfig: () => null,
        emitToUI: (command: string, params?: Record<string, unknown>) => {
          this.emit('moduleEvent', { module: def.id, command, params: params ?? {} });
        },
      };

      this.modules[def.id] = def.create(deps);
    }

    this.picoConnector.on('ready', () => {
      Logger.debugLog('Pico connected successfully', 'Pico');
    });

    this.picoConnector.init();
  }

  runCommand(module: string, command: string, params: Record<string, unknown>) {
    if (this.modules[module] && typeof this.modules[module][command] === 'function') {
      return this.modules[module][command](params ? params : {});
    }

    return Promise.reject('Wrong command');
  }
}

export default ModuleController;
