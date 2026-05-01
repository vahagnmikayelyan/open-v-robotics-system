import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'power',
  name: 'Power Monitor',
  description: 'Monitors battery level and power consumption.',
  category: 'sensor',

  getTools: () => [
    {
      module: 'power',
      name: 'power_getValue',
      description: 'Get battery voltage and charge percentage estimate',
      parameters: [],
    },
  ],

  create(deps: IModuleDeps) {
    return new PowerMonitor(deps);
  },
});

class PowerMonitor {
  constructor(private deps: IModuleDeps) {}

  getValue() {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'get');
  }
}
