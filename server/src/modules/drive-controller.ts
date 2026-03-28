import { IHardwareConnector } from '../types/hardware.js';

class DriveController {
  private readonly moduleName: string;
  private readonly connector: IHardwareConnector;

  constructor(moduleName: string, connector: IHardwareConnector) {
    this.moduleName = moduleName;
    this.connector = connector;
  }

  control(params: { fl: number; fr: number; bl: number; br: number }) {
    return this.connector.sendCommand(this.moduleName, 'control', params);
  }

  stop() {
    return this.connector.sendCommand(this.moduleName, 'stop');
  }

  goForward({ distance }: { distance: number }) {
    return this.connector.sendCommand(this.moduleName, 'move', { v: distance });
  }

  goBack({ distance }: { distance: number }) {
    return this.connector.sendCommand(this.moduleName, 'back', { v: distance });
  }

  spinLeft({ angle }: { angle: number }) {
    return this.connector.sendCommand(this.moduleName, 'spin_left', { v: angle });
  }

  spinRight({ angle }: { angle: number }) {
    return this.connector.sendCommand(this.moduleName, 'spin_right', { v: angle });
  }
}

export default DriveController;
