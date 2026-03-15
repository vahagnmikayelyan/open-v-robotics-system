import { IHardwareConnector } from '../types/types.js';

class DistanceSensor {
  private readonly moduleName: string;
  private readonly connector: IHardwareConnector;

  constructor(moduleName: string, connector: IHardwareConnector) {
    this.moduleName = moduleName;
    this.connector = connector;
  }

  getValue() {
    return this.connector.sendCommand(this.moduleName, 'get');
  }
}

export default DistanceSensor;
