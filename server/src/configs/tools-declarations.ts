import { IToolDeclaration } from '../types/tool.js';

export const toolsDeclarations: IToolDeclaration[] = [
  {
    module: 'distanceSensor',
    name: 'distanceSensor_getValue',
    description: 'Get distance to obstacle in millimeters',
    parameters: [],
  },
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
  {
    module: 'inertialSensor',
    name: 'inertialSensor_getValue',
    description: 'Read accelerometer (m/s²) and gyroscope (rad/s) axes',
    parameters: [],
  },
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
  {
    module: 'lightSensor',
    name: 'lightSensor_getValue',
    description: 'Read ambient light raw ADC and estimated brightness percentage',
    parameters: [],
  },
  {
    module: 'power',
    name: 'power_getValue',
    description: 'Get battery voltage and charge percentage estimate',
    parameters: [],
  },
  {
    module: 'thermalSensor',
    name: 'thermalSensor_getValue',
    description: 'Read temperature from the thermal sensor in °C',
    parameters: [],
  },
  {
    module: 'camera',
    name: 'camera_takePhoto',
    description:
      'Capture a still JPEG photo using camera module. Default resolution is 1280x720. Maximum resolution is 4608x2592 (12MP). Omit width/height or use 0 for defaults.',
    parameters: [
      {
        name: 'width',
        type: 'integer',
        description: 'Photo width in pixels (default 1280, max 4608); omit or 0 for default',
        isRequired: false,
      },
      {
        name: 'height',
        type: 'integer',
        description: 'Photo height in pixels (default 720, max 2592); omit or 0 for default',
        isRequired: false,
      },
    ],
  },
];
