import { IHardwareConnector } from '../types/hardware.js';

class HeadController {
  private readonly moduleName: string;
  private readonly connector: IHardwareConnector;

  constructor(moduleName: string, connector: IHardwareConnector) {
    this.moduleName = moduleName;
    this.connector = connector;
  }

  rotate({ angle = 0 }: { angle: number }) {
    return this.connector.sendCommand(this.moduleName, 'rotate', { v: angle });
  }

  toCenter() {
    return this.rotate({ angle: 0 });
  }

  toTop() {
    return this.rotate({ angle: 35 });
  }

  toBottom() {
    return this.rotate({ angle: -40 });
  }
}

export default HeadController;
