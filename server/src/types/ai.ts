import EventEmitter from 'events';

export interface IAIModelController extends EventEmitter {
  connect: () => Promise<boolean>;
  sendText: (text: string) => void;
  sendAudio: (pcmOrBase64: Buffer | string, mimeType?: string) => void;
  sendImage: (imageBytesOrBase64: Buffer | string, mimeType?: string) => void;
  sendToolResponses: (responsesArray: unknown[]) => void;
  destroy: () => void;
}

export interface IAIModelConfig {
  id: string;
  name: string;
  vendor: string;
  apiKeySetting: string;
  model: string;
  requiredModules: string[];
  // Empty array when model not support voice interactions, for text-only models
  voices: string[];
  // Empty string when model not support voice interactions, for text-only models
  defaultVoice: string;
}
