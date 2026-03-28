import { IHardwareConnector } from '../types/hardware.js';

class FanController {
  private readonly moduleName: string;
  private readonly connector: IHardwareConnector;

  constructor(moduleName: string, connector: IHardwareConnector) {
    this.moduleName = moduleName;
    this.connector = connector;
  }

  changeSpeed({ percent }: { percent: number }) {
    return this.connector.sendCommand(this.moduleName, 'changeSpeed', { v: percent });
  }
}

export default FanController;
