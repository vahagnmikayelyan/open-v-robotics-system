import { IHardwareConnector } from './hardware.js';
import { IToolDeclaration } from './tool.js';

export interface IConfigItem {
  key: string;
  label: string;
  hint?: string;
  type?: 'text' | 'number' | 'range' | 'password';
  min?: number;
  max?: number;
}

export interface IModuleCategory {
  id: string;
  label: string;
  description: string;
  order: number;
}

export interface IModuleDeps {
  moduleId: string;
  picoConnector: IHardwareConnector;
  getConfig: (key: string) => unknown;
  emitToUI: (command: string, params?: Record<string, unknown>) => void;
}

export interface IModuleDefinition {
  id: string;
  name: string;
  description: string;
  category: 'sensor' | 'actuator' | 'media' | 'service';
  moduleConfigs?: IConfigItem[];
  tools: IToolDeclaration[];
  create: (deps: IModuleDeps) => Record<string, any>;
}

export function defineModule(def: IModuleDefinition): IModuleDefinition {
  return def;
}
