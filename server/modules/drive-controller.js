class DriveController {

    constructor(moduleName, connector) {
        this.moduleName = moduleName;
        this.connector = connector;
    }

    control(flSpeed, frSpeed, blSpeed, brSpeed) {
        return this.connector.sendCommand(this.moduleName, 'control', { fl: flSpeed, fr: frSpeed, bl: blSpeed, br: brSpeed });
    }

    stop() {
        return this.connector.sendCommand(this.moduleName, 'stop');
    }

    goForward(distance) {
        return this.connector.sendCommand(this.moduleName, 'move', { v: distance });
    }

    goBack(distance) {
        return this.connector.sendCommand(this.moduleName, 'back', { v: distance });
    }

    spinLeft(angle) {
        return this.connector.sendCommand(this.moduleName, 'spin_left', { v: angle });
    }

    spinRight(angle) {
        return this.connector.sendCommand(this.moduleName, 'spin_right', { v: angle });
    }
}

export default DriveController;