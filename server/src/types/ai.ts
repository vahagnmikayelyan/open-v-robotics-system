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
