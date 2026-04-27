import { IModuleCategory, IModuleDefinition } from '../types/module.js';
import { IToolDeclaration } from '../types/tool.js';
import { IConfigGroup } from '../types/config.js';

import distanceSensor from './distance-sensor.js';
import driveController from './drive-controller.js';
import fanController from './fan-controller.js';
import headController from './head-controller.js';
import inertialSensor from './inertial-sensor.js';
import lightController from './light-controller.js';
import lightSensor from './light-sensor.js';
import powerMonitor from './power-monitor.js';
import thermalSensor from './thermal-sensor.js';
import cameraController from './camera-controller.js';
import speakerController from './speaker-controller.js';
import microphoneController from './microphone-controller.js';
import imageGenerator from './image-generator.js';

export const moduleCategories: IModuleCategory[] = [
  {
    id: 'sensor',
    label: 'Sensors & Monitoring',
    description: 'Environmental and system sensors for data collection.',
    order: 1,
  },
  {
    id: 'actuator',
    label: 'Movement & Control',
    description: 'Motors, servos, and other physical actuators.',
    order: 2,
  },
  { id: 'media', label: 'Audio & Video', description: 'Camera, microphone, and speaker peripherals.', order: 3 },
  {
    id: 'service',
    label: 'Smart Services',
    description: 'AI-powered features and external service integrations.',
    order: 4,
  },
];

export const moduleRegistry: IModuleDefinition[] = [
  distanceSensor,
  driveController,
  fanController,
  headController,
  inertialSensor,
  lightController,
  lightSensor,
  powerMonitor,
  thermalSensor,
  cameraController,
  speakerController,
  microphoneController,
  imageGenerator,
];

/** Module metadata for REST API GET /api/modules and UI */
export function getAllModuleMetadata() {
  return moduleRegistry.map(({ id, name, description, category, moduleConfigs }) => ({
    id,
    name,
    description,
    category,
    moduleConfigs: moduleConfigs ?? [],
  }));
}

/** Tool declarations for AI function calling */
export function getAllToolDeclarations(): IToolDeclaration[] {
  return moduleRegistry.flatMap((m) => m.tools);
}

/** Config groups for all modules (for settings page) */
export function getModuleConfigGroups(): IConfigGroup[] {
  return moduleRegistry
    .filter((m) => m.moduleConfigs && m.moduleConfigs.length > 0)
    .map((m) => ({
      id: m.id,
      name: m.name.toUpperCase(),
      configs: m.moduleConfigs || [],
    }));
}
