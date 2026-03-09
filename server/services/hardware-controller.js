import PicoUartConnector from './pico-uart-connector.js';
import DistanceSensor from '../modules/distance-sensor.js';
import LightController from '../modules/light-controller.js';
import PowerMonitor from '../modules/power-monitor.js';

class HardwareController {

    constructor() {
        this.picoConnector = new PicoUartConnector(this.onPicoReady);

        this.modules = {
            'distanceSensor': new DistanceSensor('distanceSensor', this.picoConnector),
            'light': new LightController('light', this.picoConnector),
            'power': new PowerMonitor('power', this.picoConnector),
        };

        this.picoConnector.init();
    }

    onPicoReady() {
        console.log('Pico connected successfully');
    }

    runCommand(module, command, params) {
        console.log(module, command, params);
        if (this.modules[module] && typeof this.modules[module][command] === 'function') {
            return params ? this.modules[module][command].apply(this.modules[module], params) : this.modules[module][command]();
        }

        return null;
    }
}

export default HardwareController;