import { IHardwareConnector } from '../types/types.js';

class HeadController {
  private readonly moduleName: string;
  private readonly connector: IHardwareConnector;

  constructor(moduleName: string, connector: IHardwareConnector) {
    this.moduleName = moduleName;
    this.connector = connector;
  }

  rotate(angle = 0) {
    return this.connector.sendCommand(this.moduleName, 'rotate', { v: angle });
  }

  toCenter() {
    return this.rotate(0);
  }

  toTop() {
    return this.rotate(-40);
  }

  toBottom() {
    return this.rotate(35);
  }
}

export default HeadController;
