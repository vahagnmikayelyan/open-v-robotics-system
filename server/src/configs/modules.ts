export const allModules: Array<{ id: string; name: string; description: string }> = [
  {
    id: 'distanceSensor',
    name: 'Distance Sensor',
    description: 'Detects obstacles and measures distance for collision avoidance.',
  },
  { id: 'drive', name: 'Drive Motors', description: 'Allows the AI to control the chassis and navigate.' },
  { id: 'fan', name: 'Active Cooling', description: 'Controls the fan for thermal management.' },
  {
    id: 'inertialSensor',
    name: 'Inertial Sensor',
    description: 'Provides tilt, acceleration, and rotation telemetry.',
  },
  { id: 'light', name: 'Lights', description: 'Controls external LEDs and visual indicators.' },
  { id: 'lightSensor', name: 'Light Sensor', description: 'Measures environmental illumination levels.' },
  { id: 'power', name: 'Power Monitor', description: 'Monitors battery level and power consumption.' },
  { id: 'headServo', name: 'Head Servo', description: 'Allows the AI to move the head for tracking.' },
  { id: 'thermalSensor', name: 'Thermal Sensor', description: 'Monitors system and environmental temperatures.' },
  { id: 'camera', name: 'Camera', description: 'Enables using Camera.' },
  { id: 'speaker', name: 'Speakers', description: 'Allows the AI to speak using stereo speakers.' },
  { id: 'microphone', name: 'Microphone', description: 'Enables microphones.' },
];
