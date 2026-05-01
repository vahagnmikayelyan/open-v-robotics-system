import { defineModule, IModuleDeps } from '../types/module.js';

export default defineModule({
  id: 'drive',
  name: 'Drive Motors',
  description: 'Allows the AI to control the chassis and navigate.',
  category: 'actuator',

  getTools: () => [
    {
      module: 'drive',
      name: 'drive_stop',
      description: 'Stop all drive motors immediately',
      parameters: [],
    },
    {
      module: 'drive',
      name: 'drive_moveDistance',
      description:
        'Drive straight for approximately the given distance in mm (positive forward, negative reverse) at the given speed percent',
      parameters: [
        {
          name: 'speed',
          type: 'integer',
          description: 'Motor speed magnitude 80-100',
          isRequired: true,
        },
        {
          name: 'distance',
          type: 'integer',
          description: 'Distance in millimeters (sign sets direction)',
          isRequired: true,
        },
      ],
    },
    {
      module: 'drive',
      name: 'drive_rotateAngle',
      description: 'Rotate in place by angle in degrees (sign sets turn direction) at the given speed percent',
      parameters: [
        {
          name: 'speed',
          type: 'integer',
          description: 'Motor speed magnitude 80-100',
          isRequired: true,
        },
        {
          name: 'angle',
          type: 'integer',
          description: 'Rotation angle in degrees',
          isRequired: true,
        },
      ],
    },
  ],

  create(deps: IModuleDeps) {
    return new DriveController(deps);
  },
});

class DriveController {
  constructor(private deps: IModuleDeps) {}

  control(params: { fl: number; fr: number; bl: number; br: number }) {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'control', params);
  }

  stop() {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'stop');
  }

  moveDistance({ speed, distance }: { speed: number; distance: number }) {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'move_distance', {
      s: Math.abs(speed),
      v: distance,
    });
  }

  rotateAngle({ speed, angle }: { speed: number; angle: number }) {
    return this.deps.picoConnector.sendCommand(this.deps.moduleId, 'rotate_angle', {
      s: Math.abs(speed),
      v: angle,
    });
  }
}
