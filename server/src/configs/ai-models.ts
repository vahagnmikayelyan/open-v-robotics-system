import { IAIModelConfig } from '../types/ai.js';

export const availableAIModels: IAIModelConfig[] = [
  {
    id: 'gemini-live-2-5-flash',
    name: 'Gemini 2.5 Flash Live Preview',
    vendor: 'gemini-live-ai',
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    requiredModules: ['speaker'],
  },
  {
    id: 'gemini-live-3-1-flash',
    name: 'Gemini 3.1 Flash Live Preview',
    vendor: 'gemini-live-ai',
    model: 'gemini-3.1-flash-live-preview',
    requiredModules: ['speaker'],
  },
];
