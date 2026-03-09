class DistanceSensor {

    constructor(moduleName, connector) {
        this.moduleName = moduleName;
        this.connector = connector;
    }

    getDistance() {
        return this.connector.sendCommand(this.moduleName, 'get');
    }
}

export default DistanceSensor;