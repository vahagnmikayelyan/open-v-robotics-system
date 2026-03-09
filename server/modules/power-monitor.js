class PowerMonitor {

    constructor(moduleName, connector) {
        this.moduleName = moduleName;
        this.connector = connector;
    }

    getVoltage() {
        return this.connector.sendCommand(this.moduleName, 'get');
    }
}

export default PowerMonitor;