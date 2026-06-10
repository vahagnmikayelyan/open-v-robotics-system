import EventEmitter from 'events';
import { IProgram } from './program.js';

export interface ISystemController extends EventEmitter {
  modules: Record<string, any>;
  runProgram: (programId: number) => Promise<void>;
  stopRunningProgram: () => void;
  getRunningProgram: () => IProgram | null;
  sendText: (text: string) => void;
  runCommand: (module: string, command: string, params: Record<string, unknown>) => Promise<unknown>;
}
