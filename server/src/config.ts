const config = {
  port: 3000,
  sqLiteDBPath: 'db/robot.db',
  webBuildPath: 'public/browser',
  debugLog: true,
  errorLog: true,
  availableAIModels: [
    { id: 'gemini-live', name: 'Gemini Live' },
    { id: 'gpt-realtime', name: 'GPT Realtime' },
  ],
  availableModules: [
    'distanceSensor',
    'drive',
    'fan',
    'inertialSensor',
    'light',
    'lightSensor',
    'power',
    'headServo',
    'thermalSensor',
    'camera',
    'speaker',
    'microphone',
  ],
};

export default config;
