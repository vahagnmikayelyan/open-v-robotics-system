import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'fan',
  name: 'Active Cooling',
  description: 'Controls the fan for thermal management.',
  category: 'actuator',

  getTools: () => [
    {
      module: 'fan',
      name: 'fan_changeSpeed',
      description: 'Set cooling fan speed',
      parameters: [
        {
          name: 'percent',
          type: 'integer',
          description: 'Fan duty cycle 0-100',
          isRequired: true,
        },
      ],
    },
  ],

  create(deps: IModuleDeps) {
    return new FanController(deps);
  },
});

class FanController {
  constructor(private deps: IModuleDeps) {}

  changeSpeed({ percent }: { percent: number }) {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'changeSpeed', { v: percent });
  }
}
