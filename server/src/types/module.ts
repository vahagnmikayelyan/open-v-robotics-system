import { IHardwareConnector } from './hardware.js';
import { IToolDeclaration } from './tool.js';

export interface IConfigItem {
  key: string;
  label: string;
  hint?: string;
  type?: 'text' | 'number' | 'range' | 'password' | 'select' | 'toggle';
  min?: number;
  max?: number;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
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
  getProgramConfig: (key: string) => unknown;
  emitToUI: (command: string, params?: Record<string, unknown>) => void;
  emitSystemError: (message: string) => void;
}

export interface IModuleDefinition {
  id: string;
  name: string;
  description: string;
  category: 'sensor' | 'actuator' | 'media' | 'service';
  moduleConfigs?: IConfigItem[];
  programConfigs?: IConfigItem[];
  getTools: (programConfig?: Record<string, unknown>) => IToolDeclaration[];
  create: (deps: IModuleDeps) => Record<string, any>;
}

export function defineModule(def: IModuleDefinition): IModuleDefinition {
  return def;
}
