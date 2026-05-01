import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'lightSensor',
  name: 'Light Sensor',
  description: 'Measures environmental illumination levels.',
  category: 'sensor',

  getTools: () => [
    {
      module: 'lightSensor',
      name: 'lightSensor_getValue',
      description: 'Read ambient light raw ADC and estimated brightness percentage',
      parameters: [],
    },
  ],

  create(deps: IModuleDeps) {
    return new LightSensor(deps);
  },
});

class LightSensor {
  constructor(private deps: IModuleDeps) {}

  getValue() {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'get');
  }
}
