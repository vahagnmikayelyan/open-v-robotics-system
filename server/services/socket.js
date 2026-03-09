class Socket {

    events = {};

    constructor(ws) {
        this.ws = ws;
        this.init();
    }

    init() {
        this.ws.on('open', () => this.events['connect'] && this.events['connect']());
        this.ws.on('close', () => this.events['disconnect'] && this.events['disconnect']());
        this.ws.on('error', () => this.events['error'] && this.events['error']());
        this.ws.on('message', (message) => this.handleMessage(message));
    }

    handleMessage(message) {

        const data = JSON.parse(message);

		console.log('handleMessage', data);

        if (this.events[data.event]) {
            this.events[data.event](data.data);
        }
    }

    on(eventName, cb) {
        this.events[eventName] = cb;
    }

    off(eventName) {
        if (this.events[eventName]) {
            delete this.events[eventName];
        }
    }

    emit(eventName, data) {
        this.ws.readyState === this.ws.OPEN && this.ws.send(JSON.stringify({ event: eventName, data: data }));
    }

    destroy() {
		this.ws.close();
    }
}

export default Socket;