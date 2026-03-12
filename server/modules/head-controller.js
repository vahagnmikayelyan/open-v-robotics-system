class HeadController {

    constructor(moduleName, connector) {
        this.moduleName = moduleName;
        this.connector = connector;
    }

    rotate(angle = 0) {
        return this.connector.sendCommand(this.moduleName, 'rotate', { v: angle });
    }

    toCenter() {
        return this.rotate(0);
    }

    toTop() {
        return this.rotate(-40);
    }

    toBottom() {
        return this.rotate(35);
    }
}

export default HeadController;