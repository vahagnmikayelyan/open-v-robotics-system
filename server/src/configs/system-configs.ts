import { IConfigGroup } from '../types/config.js';

export const systemConfigGroups: IConfigGroup[] = [
  {
    id: 'general',
    name: 'GENERAL',
    configs: [
      {
        key: 'general_robotName',
        label: 'Robot Name',
        hint: 'Used in AI models',
        type: 'text',
      },
      {
        key: 'general_maxSpeedLimit',
        label: 'Global Speed Limit',
        hint: 'Safety cap (10%-100%)',
        type: 'range',
        min: 10,
        max: 100,
      },
    ],
  },
  {
    id: 'gemini',
    name: 'GEMINI LIVE',
    configs: [
      {
        key: 'geminiLive_apiKey',
        label: 'Gemini API key',
        hint: 'Google AI Studio / Gemini API',
        type: 'text',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OPENAI REALTIME',
    configs: [
      {
        key: 'openaiRealtime_apiKey',
        label: 'OpenAI API key',
        hint: 'platform.openai.com / API keys',
        type: 'text',
      },
    ],
  },
];
