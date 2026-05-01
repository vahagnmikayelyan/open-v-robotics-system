import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'light',
  name: 'Lights',
  description: 'Controls external LEDs and visual indicators.',
  category: 'actuator',

  getTools: () => [
    {
      module: 'light',
      name: 'light_turnOn',
      description: 'Turn on both lights at default brightness',
      parameters: [],
    },
    {
      module: 'light',
      name: 'light_turnOff',
      description: 'Turn off both lights',
      parameters: [],
    },
    {
      module: 'light',
      name: 'light_light',
      description: 'Set left and right light brightness independently',
      parameters: [
        {
          name: 'leftPercent',
          type: 'integer',
          description: 'Left light percentage 0-100',
          isRequired: true,
        },
        {
          name: 'rightPercent',
          type: 'integer',
          description: 'Right light percentage 0-100',
          isRequired: true,
        },
      ],
    },
  ],

  create(deps: IModuleDeps) {
    return new LightController(deps);
  },
});

class LightController {
  constructor(private deps: IModuleDeps) {}

  light({ leftPercent = 50, rightPercent = 50 }: { leftPercent: number; rightPercent: number }) {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'light', { l: leftPercent, r: rightPercent });
  }

  turnOn() {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'turnOn');
  }

  turnOff() {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'turnOff');
  }
}
