import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'inertialSensor',
  name: 'Inertial Sensor',
  description: 'Provides tilt, acceleration, and rotation telemetry.',
  category: 'sensor',

  tools: [
    {
      module: 'inertialSensor',
      name: 'inertialSensor_getValue',
      description: 'Read accelerometer (m/s²) and gyroscope (rad/s) axes',
      parameters: [],
    },
  ],

  create(deps: IModuleDeps) {
    return new InertialSensor(deps);
  },
});

class InertialSensor {
  constructor(private deps: IModuleDeps) {}

  getValue() {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'get');
  }
}
