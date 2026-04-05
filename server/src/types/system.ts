import EventEmitter from 'events';
import { IProgram } from './program.js';

export interface ISystemController extends EventEmitter {
  runProgram: (programId: number) => Promise<void>;
  stopRunningProgram: () => void;
  getRunningProgram: () => IProgram | null;
  sendText: (text: string) => void;
}
