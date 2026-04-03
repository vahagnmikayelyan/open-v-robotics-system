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

  moveDistance({ speed, distance }: { speed: number; distance: number }) {
    return this.connector.sendCommand(this.moduleName, 'move_distance', { s: Math.abs(speed), v: distance });
  }

  rotateAngle({ speed, angle }: { speed: number; angle: number }) {
    return this.connector.sendCommand(this.moduleName, 'rotate_angle', { s: Math.abs(speed), v: angle });
  }
}

export default DriveController;
