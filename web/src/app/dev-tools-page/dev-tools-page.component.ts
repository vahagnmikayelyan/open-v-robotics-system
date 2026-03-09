import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiSocketService } from '../../services/ui-socket.service';
import { ChatMessage, ChatMessageType } from '../../models/models';
import { ChatComponent } from '../../components/chat/chat.component';
import { SensorTileComponent } from '../../components/sensor-tile/sensor-tile.component';
import { DualLedControlComponent, LedState } from '../../components/dual-led-control/dual-led-control.component';

@Component({
    selector: 'dev-tools-page',
    imports: [
        FormsModule,
        ChatComponent,
        SensorTileComponent,
        DualLedControlComponent,
    ],
    templateUrl: './dev-tools-page.component.html',
    styleUrl: './dev-tools-page.component.less'
})
export class DevToolsPageComponent implements OnInit {
    private uiSocketService = inject(UiSocketService);

    messages = signal<ChatMessage[]>([]);

    modulesUpdatesTimers: Record<string, { timerId: any | null, action: string, params: any[] | null }> = {
        power: { timerId: null, action: 'getVoltage', params: null },
        distanceSensor: { timerId: null, action: 'getDistance', params: null },
    };

    powerDataSignal = signal({ v: 0, p: 0 });
    distanceSensorDataSignal = signal({ v: 0 });

    ngOnInit() {
        this.uiSocketService.onInit.subscribe(() => {
            this.addMessage('Init', ChatMessageType.systemCommand);
        });

        this.uiSocketService.onCommandResult.subscribe((message) => {
            this.addMessage(JSON.stringify(message), ChatMessageType.systemCommand);
            this.handleCommandResult(message);
        });
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

            if (commandResult.module === 'distanceSensor') {
                this.distanceSensorDataSignal.set(commandResult);
            }
        }
    }

    runCommand(module: string, command: string, params: any[] | null = null) {
        const chatMessage = params ? `${module} -> ${command} (${JSON.stringify(params)})` : `${module} -> ${command}`
        this.addMessage(chatMessage, ChatMessageType.userCommand);
        this.uiSocketService.sendCommand(module, command, params);
    }

    changeModuleUpdates(module: string, isEnabled: boolean) {
        console.log('changeModuleUpdates', module, isEnabled);

        this.modulesUpdatesTimers[module].timerId && clearInterval(this.modulesUpdatesTimers[module].timerId);

        if (isEnabled) {
            this.modulesUpdatesTimers[module].timerId = setInterval(() => {
                this.uiSocketService.sendCommand(module, this.modulesUpdatesTimers[module].action, this.modulesUpdatesTimers[module].params);
            }, 500);
        }
    }

    changeLed(values: LedState) {
        this.runCommand('light', 'light', [values.left, values.right]);
    }
}
