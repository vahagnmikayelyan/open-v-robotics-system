export enum ChatMessageType {
  user = 'user',
  system = 'system',
  userCommand = 'userCommand',
  systemCommand = 'systemCommand'
}

export interface ChatMessage {
  text: string;
  type: ChatMessageType;
  timestamp?: Date;
}
