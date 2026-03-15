import { IHardwareConnector } from '../types/types.js';

class DriveController {
  private readonly moduleName: string;
  private readonly connector: IHardwareConnector;

  constructor(moduleName: string, connector: IHardwareConnector) {
    this.moduleName = moduleName;
    this.connector = connector;
  }

  control(flSpeed: number, frSpeed: number, blSpeed: number, brSpeed: number) {
    return this.connector.sendCommand(this.moduleName, 'control', {
      fl: flSpeed,
      fr: frSpeed,
      bl: blSpeed,
      br: brSpeed
    });
  }

  stop() {
    return this.connector.sendCommand(this.moduleName, 'stop');
  }

  goForward(distance: number) {
    return this.connector.sendCommand(this.moduleName, 'move', { v: distance });
  }

  goBack(distance: number) {
    return this.connector.sendCommand(this.moduleName, 'back', { v: distance });
  }

  spinLeft(angle: number) {
    return this.connector.sendCommand(this.moduleName, 'spin_left', { v: angle });
  }

  spinRight(angle: number) {
    return this.connector.sendCommand(this.moduleName, 'spin_right', { v: angle });
  }
}

export default DriveController;
