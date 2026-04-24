export interface IConfig {
  key: string;
  value: unknown;
}

import { IConfigItem } from './module.js';

export interface IConfigGroup {
  id: string;
  name: string;
  configs: IConfigItem[];
}

export interface IConfigRepository {
  getAll: () => IConfig[];
  getValue: (key: string, defaultValue?: unknown) => IConfig['value'];
  set: (config: IConfig) => IConfig;
  setMany: (configs: IConfig[]) => void;
}

export interface IConfigController {
  getAll: () => IConfig[];
  getConfig: (key: string, defaultValue?: unknown) => IConfig['value'];
  updateConfig: (config: IConfig) => IConfig;
  updateConfigs: (configs: IConfig[]) => number;
}
