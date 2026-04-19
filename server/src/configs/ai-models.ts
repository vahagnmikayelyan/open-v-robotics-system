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

/** OpenAI Realtime prebuilt voice names */
const OPENAI_REALTIME_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar',
];

export const availableAIModels: IAIModelConfig[] = [
  {
    id: 'gemini-live-2-5-flash',
    name: 'Gemini 2.5 Flash Live Preview',
    vendor: 'gemini-live',
    apiKeySetting: 'geminiLive_apiKey',
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    requiredModules: ['speaker'],
    micSampleRate: 16000,
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
    micSampleRate: 16000,
    voices: GEMINI_LIVE_VOICES,
    defaultVoice: 'Kore',
  },
  {
    id: 'openai-realtime',
    name: 'OpenAI Realtime (GPT)',
    vendor: 'openai-realtime',
    apiKeySetting: 'openaiRealtime_apiKey',
    model: 'gpt-realtime',
    requiredModules: ['speaker'],
    micSampleRate: 24000,
    voices: OPENAI_REALTIME_VOICES,
    defaultVoice: 'cedar',
  },
  {
    id: 'openai-realtime-mini',
    name: 'OpenAI Realtime Mini',
    vendor: 'openai-realtime',
    apiKeySetting: 'openaiRealtime_apiKey',
    model: 'gpt-realtime-mini',
    requiredModules: ['speaker'],
    micSampleRate: 24000,
    voices: OPENAI_REALTIME_VOICES,
    defaultVoice: 'cedar',
  },
];
