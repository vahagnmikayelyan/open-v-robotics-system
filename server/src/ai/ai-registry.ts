import { IAIControllerParams, IAIModelController } from '../types/ai.js';
import GeminiLiveAI from './gemini/gemini-live-ai.js';
import OpenAIRealtimeAI from './openai/openai-realtime-ai.js';

type AIControllerClass = new (params: IAIControllerParams) => IAIModelController;

const registry = new Map<string, AIControllerClass>();

export function registerAI(vendor: string, aiClass: AIControllerClass) {
  registry.set(vendor, aiClass);
}

export function createAIController(vendor: string, params: IAIControllerParams): IAIModelController {
  const AIClass = registry.get(vendor);

  if (!AIClass) {
    throw new Error(`Unknown AI vendor: "${vendor}"`);
  }

  return new AIClass(params);
}

registerAI('gemini-live', GeminiLiveAI);
registerAI('openai-realtime', OpenAIRealtimeAI);
