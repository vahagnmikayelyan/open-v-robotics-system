class FanController {

    constructor(moduleName, connector) {
        this.moduleName = moduleName;
        this.connector = connector;
    }

    changeSpeed(percent) {
        return this.connector.sendCommand(this.moduleName, 'changeSpeed', { v: percent });
    }
}

export default FanController;