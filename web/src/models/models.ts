export enum ChatMessageType {
  user = 'user',
  system = 'system',
  userCommand = 'userCommand',
  systemCommand = 'systemCommand',
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
}

export interface IProgram {
  id: number;
  name: string;
  systemInstruction: string;
  aiModel: string;
  modules: string[];
}

export interface IModule {
  id: string;
  name: string;
  description: string;
}
