import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'distanceSensor',
  name: 'Distance Sensor',
  description: 'Detects obstacles and measures distance for collision avoidance.',
  category: 'sensor',

  tools: [
    {
      module: 'distanceSensor',
      name: 'distanceSensor_getValue',
      description: 'Get distance to obstacle in millimeters',
      parameters: [],
    },
  ],

  create(deps: IModuleDeps) {
    return new DistanceSensor(deps);
  },
});

class DistanceSensor {
  constructor(private deps: IModuleDeps) {}

  getValue() {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'get');
  }
}
