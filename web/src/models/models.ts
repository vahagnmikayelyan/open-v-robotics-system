export enum ChatMessageType {
  user = 'user',
  system = 'system',
  userCommand = 'userCommand',
  systemCommand = 'systemCommand',
  systemError = 'systemError',
}

export interface IChatMessage {
  text: string;
  type: ChatMessageType;
  timestamp?: Date;
}

export interface IConfig {
  key: string;
  value: unknown;
}

export interface IConfigItem {
  key: string;
  label: string;
  hint?: string;
  type?: 'text' | 'number' | 'range' | 'password';
  min?: number;
  max?: number;
}

export interface IConfigGroup {
  id: string;
  name: string;
  configs: IConfigItem[];
}

export interface IConfigResponse {
  configs: IConfig[];
  schema: IConfigGroup[];
}

export type ModuleCommandParams = Record<string, unknown> | null;

export interface IModuleCommand {
  module: string;
  action: string;
  params: ModuleCommandParams;
}

export interface IAIModelConfig {
  id: string;
  name: string;
  vendor: string;
  model: string;
  requiredModules: string[];
  voices: string[];
  defaultVoice: string;
}

export interface IProgram {
  id: number;
  name: string;
  systemInstruction: string;
  aiModel: string;
  voice: string;
  modules: string[];
}

export interface IModule {
  id: string;
  name: string;
  description: string;
  category: 'sensor' | 'actuator' | 'media' | 'service';
  moduleConfigs: IConfigItem[];
}

export interface IModuleCategory {
  id: string;
  label: string;
  description: string;
  order: number;
}

export interface IModulesResponse {
  categories: IModuleCategory[];
  modules: IModule[];
}
