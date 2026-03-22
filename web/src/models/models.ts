export enum ChatMessageType {
  user = 'user',
  system = 'system',
  userCommand = 'userCommand',
  systemCommand = 'systemCommand',
}

export interface ChatMessage {
  text: string;
  type: ChatMessageType;
  timestamp?: Date;
}

export interface IConfig {
  key: string;
  value: unknown;
}

export interface ModuleCommand {
  module: string;
  action: string;
  params: any[] | null;
}

export interface AiModel {
    id: string;
    name: string;
}

export interface Program {
    id: string;
    name: string;
    systemInstruction: string;
    aiModel: string;
    modules: string[];
}

