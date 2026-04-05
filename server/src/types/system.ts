import EventEmitter from 'events';

export interface ISystemController extends EventEmitter {
  runProgram: (programId: number) => void;
  sendText: (text: string) => void;
}
