import { IConfig, IConfigController, IConfigRepository } from '../types/config.js';

class ConfigController implements IConfigController {
  repository: IConfigRepository;

  constructor(configRepository: IConfigRepository) {
    this.repository = configRepository;
  }

  getAll() {
    return this.repository.getAll();
  }

  getConfig(key: string) {
    const value = this.repository.getValue(key);
    if (value === null) {
      throw new Error(`Config with key '${key}' not found`);
    }
    return value;
  }

  updateConfig(config: IConfig) {
    return this.repository.set(config);
  }

  updateConfigs(configs: IConfig[]) {
    if (!configs || configs.length === 0) {
      throw new Error('No configs provided for update');
    }

    this.repository.setMany(configs);
    return configs.length;
  }
}

export default ConfigController;
