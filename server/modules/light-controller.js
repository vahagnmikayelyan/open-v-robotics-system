class LightController {

    constructor(moduleName, connector) {
        this.moduleName = moduleName;
        this.connector = connector;
    }

    light(leftPercent = 50, rightPercent = 50) {
        return this.connector.sendCommand(this.moduleName, 'light', { l: leftPercent, r: rightPercent });
    }

    turnOn() {
        return this.connector.sendCommand(this.moduleName, 'turnOn');
    }

    turnOff() {
        return this.connector.sendCommand(this.moduleName, 'turnOff');
    }
}

export default LightController;