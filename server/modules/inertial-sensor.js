class InertialSensor {

    constructor(moduleName, connector) {
        this.moduleName = moduleName;
        this.connector = connector;
    }

    getValue() {
        return this.connector.sendCommand(this.moduleName, 'get');
    }
}

export default InertialSensor;