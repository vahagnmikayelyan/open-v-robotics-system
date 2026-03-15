import type { WebSocket } from 'ws';

class Socket {

  private events: Record<string, (data?: any) => void> = {};
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.init();
  }

  init() {
    this.ws.on('open', () => this.events['connect'] && this.events['connect']());
    this.ws.on('close', () => this.events['disconnect'] && this.events['disconnect']());
    this.ws.on('error', () => this.events['error'] && this.events['error']());
    this.ws.on('message', (message: string) => this.handleMessage(message));
  }

  handleMessage(message: string) {

    const data = JSON.parse(message);

    console.log('handleMessage', data);

    if (this.events[data.event]) {
      this.events[data.event](data.data);
    }
  }

  on<T = any>(eventName: string, cb: (data: T) => void) {
    this.events[eventName] = cb;
  }

  off(eventName: string) {
    if (this.events[eventName]) {
      delete this.events[eventName];
    }
  }

  emit(eventName: string, data?: unknown) {
    this.ws.readyState === this.ws.OPEN && this.ws.send(JSON.stringify({ event: eventName, data: data }));
  }

  destroy() {
    this.ws.close();
  }
}

export default Socket;
