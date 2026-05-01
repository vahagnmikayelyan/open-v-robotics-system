import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'thermalSensor',
  name: 'Thermal Sensor',
  description: 'Monitors system and environmental temperatures.',
  category: 'sensor',

  getTools: () => [
    {
      module: 'thermalSensor',
      name: 'thermalSensor_getValue',
      description: 'Read temperature from the thermal sensor in °C',
      parameters: [],
    },
  ],

  create(deps: IModuleDeps) {
    return new ThermalSensor(deps);
  },
});

class ThermalSensor {
  constructor(private deps: IModuleDeps) {}

  getValue() {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'get');
  }
}
