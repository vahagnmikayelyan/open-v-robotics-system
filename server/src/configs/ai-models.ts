import { IAIModelConfig } from '../types/ai.js';

/** Gemini Live prebuilt voice names (Google AI) */
const GEMINI_LIVE_VOICES = [
  'Zephyr',
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Aoede',
  'Leda',
  'Orus',
  'Umbriel',
  'Enceladus',
];

export const availableAIModels: IAIModelConfig[] = [
  {
    id: 'gemini-live-2-5-flash',
    name: 'Gemini 2.5 Flash Live Preview',
    vendor: 'gemini-live',
    apiKeySetting: 'geminiLive_apiKey',
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    requiredModules: ['speaker'],
    voices: GEMINI_LIVE_VOICES,
    defaultVoice: 'Kore',
  },
  {
    id: 'gemini-live-3-1-flash',
    name: 'Gemini 3.1 Flash Live Preview',
    vendor: 'gemini-live',
    apiKeySetting: 'geminiLive_apiKey',
    model: 'gemini-3.1-flash-live-preview',
    requiredModules: ['speaker'],
    voices: GEMINI_LIVE_VOICES,
    defaultVoice: 'Kore',
  },
];
