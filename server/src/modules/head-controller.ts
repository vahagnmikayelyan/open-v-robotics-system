import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'headServo',
  name: 'Head Servo',
  description: 'Allows the AI to move the head for tracking.',
  category: 'actuator',

  getTools: () => [
    {
      module: 'headServo',
      name: 'headServo_rotate',
      description: 'Move head to angle in degrees relative to center (0). Typical range about 35 (up) to -45 (down).',
      parameters: [
        {
          name: 'angle',
          type: 'integer',
          description: 'Target angle in degrees relative to center',
          isRequired: true,
        },
      ],
    },
    {
      module: 'headServo',
      name: 'headServo_toCenter',
      description: 'Center the head (0 degrees)',
      parameters: [],
    },
    {
      module: 'headServo',
      name: 'headServo_toTop',
      description: 'Tilt head to upper preset',
      parameters: [],
    },
    {
      module: 'headServo',
      name: 'headServo_toBottom',
      description: 'Tilt head to lower preset',
      parameters: [],
    },
  ],

  create(deps: IModuleDeps) {
    return new HeadController(deps);
  },
});

class HeadController {
  constructor(private deps: IModuleDeps) {}

  rotate({ angle = 0 }: { angle: number }) {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'rotate', { v: angle });
  }

  toCenter() {
    return this.rotate({ angle: 0 });
  }

  toTop() {
    return this.rotate({ angle: 35 });
  }

  toBottom() {
    return this.rotate({ angle: -40 });
  }
}
