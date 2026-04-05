import { EventEmitter, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { WebsocketWrapper } from './websocket-wrapper';
import { IProgram, ModuleCommandParams } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UiSocketService {
  // Socket events
  public onConnect = new EventEmitter<null>();
  public onDisconnect = new EventEmitter<null>();
  public onReconnect = new EventEmitter<null>();

  public onInit = new EventEmitter<null>();
  public onCommandResult = new EventEmitter<any>();
  public onCameraData = new EventEmitter<string>();
  public onAIMessage = new EventEmitter<string>();
  public onProgramChange = new EventEmitter<IProgram | null>();

  private wss: WebsocketWrapper | undefined;

  public init() {
    const url = `${location.protocol}//${location.hostname}:${environment.serverPort}/socket`;
    this.wss = new WebsocketWrapper(url);

    this.wss.on('connect', () => this.onConnect.emit());
    this.wss.on('reconnect', () => this.onReconnect.emit());
    this.wss.on('disconnect', () => this.onDisconnect.emit());

    this.wss.on('init', (data: any) => this.onInit.emit(data));
    this.wss.on('commandResult', (data: any) => this.onCommandResult.emit(data));
    this.wss.on('cameraData', (data: string) => this.onCameraData.emit(data));
    this.wss.on('aiMessage', (data: string) => this.onAIMessage.emit(data));
    this.wss.on('programChange', (data: IProgram | null) => this.onProgramChange.emit(data));
  }

  private send(event: string, data: any = null) {
    this.wss?.send(event, data);
  }

  sendCommand(module: string, command: string, params: ModuleCommandParams) {
    this.send('command', { module, command, params });
  }

  sendMessage(text: string) {
    this.send('message', text);
  }

  runProgram(programId: number) {
    this.send('runProgram', programId);
  }

  stopRunningProgram() {
    this.send('stopRunningProgram');
  }

  getRunningProgram() {
    this.send('getRunningProgram');
  }
}
