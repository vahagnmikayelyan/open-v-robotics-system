export interface IConfig {
  key: string;
  value: unknown;
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
