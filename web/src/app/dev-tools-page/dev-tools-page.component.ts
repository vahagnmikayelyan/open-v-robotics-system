import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { UiSocketService } from '../../services/ui-socket.service';
import { ChatMessage, ChatMessageType } from '../../models/models';
import { ChatComponent } from '../../components/chat/chat.component';
import { UiSliderComponent } from '../../components/ui-slider/ui-slider.component';
import { SensorTileComponent } from '../../components/sensor-tile/sensor-tile.component';
import { ImuWidgetComponent, MpuData } from '../../components/imu-widget/imu-widget.component';
import { MotorCommand, MotorControlComponent } from '../../components/motor-control/motor-control.component';
import { DualLedControlComponent, LedState } from '../../components/dual-led-control/dual-led-control.component';
import { CameraWidgetComponent } from '../../components/camera-widget/camera-widget.component';

@Component({
    selector: 'dev-tools-page',
    imports: [
        FormsModule,
        ChatComponent,
        UiSliderComponent,
        SensorTileComponent,
        ImuWidgetComponent,
        MotorControlComponent,
        DualLedControlComponent,
        CameraWidgetComponent
    ],
    templateUrl: './dev-tools-page.component.html',
    styleUrl: './dev-tools-page.component.less'
})
export class DevToolsPageComponent implements OnInit {
    private uiSocketService = inject(UiSocketService);

    messages = signal<ChatMessage[]>([]);

    modulesUpdatesTimers: Record<string, { timerId: any | null, action: string, params: any[] | null }> = {
        power: { timerId: null, action: 'getValue', params: null },
        lightSensor: { timerId: null, action: 'getValue', params: null },
        distanceSensor: { timerId: null, action: 'getValue', params: null },
        thermalSensor: { timerId: null, action: 'getValue', params: null },
        inertialSensor: { timerId: null, action: 'getValue', params: null },
    };

    powerDataSignal = signal({ v: 0, p: 0 });
    lightSensorDataSignal = signal({ v: 0, p: 0 });
    distanceSensorDataSignal = signal({ v: 0 });
    thermalSensorDataSignal = signal({ v: 0 });
    inertialSensorDataSignal = signal<MpuData>({ accel: {x: 0, y: 0, z: 0}, gyro: { x: 0, y: 0, z: 0} });

    fanSpeed = signal<number>(0);
    servoAngle = signal<number>(0);

    platformVersion = signal<string>('');

    ngOnInit() {
        this.uiSocketService.onInit.subscribe(() => {
            this.addMessage('Init', ChatMessageType.systemCommand);
        });

        this.uiSocketService.onCommandResult.subscribe((message) => {
            this.addMessage(JSON.stringify(message), ChatMessageType.systemCommand);
            this.handleCommandResult(message);
        });

        this.platformVersion.set(environment.version);
    }

    addMessage(text: string, type: ChatMessageType) {
        const newMessage: ChatMessage = { text, type, timestamp: new Date()};
        this.messages.update(prev => [...prev, newMessage]);
    }

    handleCommandResult(commandResult: any) {

        if (commandResult && commandResult.hasOwnProperty('module')) {
            if (commandResult.module === 'power') {
                this.powerDataSignal.set(commandResult);
            }

            if (commandResult.module === 'lightSensor') {
                this.lightSensorDataSignal.set(commandResult);
            }

            if (commandResult.module === 'distanceSensor') {
                this.distanceSensorDataSignal.set(commandResult);
            }

            if (commandResult.module === 'thermalSensor') {
                this.thermalSensorDataSignal.set(commandResult);
            }

            if (commandResult.module === 'inertialSensor') {
                this.inertialSensorDataSignal.set({
                    accel: { x: commandResult.a[0], y: commandResult.a[1], z: commandResult.a[2] },
                    gyro: { x: commandResult.g[0], y: commandResult.g[1], z: commandResult.g[2] },
                });
            }
        }
    }

    runCommand(module: string, command: string, params: any[] | null = null) {
        const chatMessage = params ? `${module} -> ${command} (${JSON.stringify(params)})` : `${module} -> ${command}`
        this.addMessage(chatMessage, ChatMessageType.userCommand);
        this.uiSocketService.sendCommand(module, command, params);
    }

    changeModuleUpdates(module: string, isEnabled: boolean) {
        this.modulesUpdatesTimers[module].timerId && clearInterval(this.modulesUpdatesTimers[module].timerId);

        if (isEnabled) {
            this.modulesUpdatesTimers[module].timerId = setInterval(() => {
                this.uiSocketService.sendCommand(module, this.modulesUpdatesTimers[module].action, this.modulesUpdatesTimers[module].params);
            }, 500);
        }
    }

    changeFanSpeed(speed: number) {
        this.runCommand('fan', 'changeSpeed', [speed]);
    }

    changeServoAngle(angle: number) {
        this.runCommand('headServo', 'rotate', [angle]);
    }

    handleMotorCommand({ type, data}: MotorCommand) {
        this.runCommand('drive', type, [data.fl, data.fr, data.bl, data.br]);
    }

    changeLed(values: LedState) {
        this.runCommand('light', 'light', [values.left, values.right]);
    }
}
