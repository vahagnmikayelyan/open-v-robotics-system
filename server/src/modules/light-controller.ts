import { IHardwareConnector } from '../types/hardware.js';

class LightController {
  private readonly moduleName: string;
  private readonly connector: IHardwareConnector;

  constructor(moduleName: string, connector: IHardwareConnector) {
    this.moduleName = moduleName;
    this.connector = connector;
  }

  light({ leftPercent = 50, rightPercent = 50 }: { leftPercent: number; rightPercent: number }) {
    return this.connector.sendCommand(this.moduleName, 'light', { l: leftPercent, r: rightPercent });
  }

  turnOn() {
    return this.connector.sendCommand(this.moduleName, 'turnOn');
  }

  turnOff() {
    return this.connector.sendCommand(this.moduleName, 'turnOff');
  }
}

export default LightController;
