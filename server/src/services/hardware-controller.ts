import { IHardwareConnector, IHardwareController } from '../types/types.js';

import PicoUartConnector from './pico-uart-connector.js';
import DistanceSensor from '../modules/distance-sensor.js';
import DriveController from '../modules/drive-controller.js';
import FanController from '../modules/fan-controller.js';
import HeadController from '../modules/head-controller.js';
import InertialSensor from '../modules/inertial-sensor.js';
import LightController from '../modules/light-controller.js';
import LightSensor from '../modules/light-sensor.js';
import PowerMonitor from '../modules/power-monitor.js';
import ThermalSensor from '../modules/thermal-sensor.js';
import CameraController from '../modules/camera-controller.js';
import SpeakerController from '../modules/speaker-controller.js';

class HardwareController implements IHardwareController {
  private readonly picoConnector: IHardwareConnector;
  modules: Record<string, any>;

  constructor() {
    this.picoConnector = new PicoUartConnector();

    this.modules = {
      distanceSensor: new DistanceSensor('distanceSensor', this.picoConnector),
      drive: new DriveController('drive', this.picoConnector),
      fan: new FanController('fan', this.picoConnector),
      inertialSensor: new InertialSensor('inertialSensor', this.picoConnector),
      light: new LightController('light', this.picoConnector),
      lightSensor: new LightSensor('lightSensor', this.picoConnector),
      power: new PowerMonitor('power', this.picoConnector),
      headServo: new HeadController('headServo', this.picoConnector),
      thermalSensor: new ThermalSensor('thermalSensor', this.picoConnector),
      camera: new CameraController(),
      speaker: new SpeakerController(),
    };

    this.picoConnector.on('ready', this.onPicoReady);
    this.picoConnector.init();
  }

  private onPicoReady() {
    console.log('Pico connected successfully');
  }

  runCommand(module: string, command: string, params: Record<string, unknown>) {
    console.log(module, command, params);
    if (this.modules[module] && typeof this.modules[module][command] === 'function') {
      return params ? this.modules[module][command].apply(this.modules[module], params) : this.modules[module][command]();
    }

    return null;
  }
}

export default HardwareController;
