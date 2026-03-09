export class WebsocketWrapper {

    private ws: WebSocket | undefined;
    private callbacks: { [key: string]: Function } = {};
    private attemptsCount = 10;
    private attempt = 0;
    private tryConnect: boolean = true;

    constructor(private url: string) {
        this.connect();
    }

    private connect() {
        this.ws = new WebSocket(this.url);
        this.ws.addEventListener('open', () => this.onOpen());
        this.ws.addEventListener('message', (data) => this.onMessage(data.data));
        this.ws.addEventListener('close', () => this.onClose());
        this.ws.addEventListener('error', (error) => this.onError(error));
    }

    private reconnect() {
        if (this.tryConnect && this.attempt < this.attemptsCount) {
            this.attempt++;
            setTimeout(() => this.connect(), this.attempt * 1000);
        }
    }

    private onOpen() {
        this.emitResponse(this.attempt === 0 ? 'connect' : 'reconnect', null);
    }

    private onClose() {
        this.emitResponse('disconnect', null);
        this.reconnect();
    }

    private onMessage(message: any) {
        const data = JSON.parse(message);
        this.emitResponse(data.event, data.data);
    }

    private onError(error: any) {
        this.emitResponse('error', error);
    }

    private emitResponse(event: string, data: any) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event](data);
        }
    }

    on(event: string, cb: Function) {
        this.callbacks[event] = cb;
    }

    off(event: string) {
        if (this.callbacks.hasOwnProperty(event)) {
            delete this.callbacks[event];
        }
    }

    send(event: string, data: any) {
        this.ws && this.ws.readyState === WebSocket.OPEN && this.ws.send(JSON.stringify({event, data}));
    }

    close() {
        this.tryConnect = false;
        this.ws && this.ws.readyState === WebSocket.OPEN && this.ws.close();
    }
}
