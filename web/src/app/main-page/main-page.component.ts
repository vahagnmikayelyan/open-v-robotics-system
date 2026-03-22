import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UiSocketService } from '../../services/ui-socket.service';
import { BatteryStatusComponent } from '../../components/battery-status/battery-status.component';

@Component({
  selector: 'main-page',
  standalone: true,
  imports: [BatteryStatusComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.less',
})
export class MainPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  pupilOffset = signal({ x: 0, y: 0 });
  isBlinking = signal(false);
  batteryLevel = signal(0);

  private blinkTimer: any;
  private idleTimer: any;
  private holdTimer: any;
  private voltageTimer: any;

  constructor(private uiSocketService: UiSocketService) {}

  ngOnInit() {
    this.uiSocketService.onInit.subscribe(() => {
      this.getVoltageLevel();
    });

    this.uiSocketService.onCommandResult.subscribe((commandResult) => {
      try {
        if (commandResult && commandResult.hasOwnProperty('module') && commandResult.module === 'power') {
          this.batteryLevel.set(commandResult.p);
        }
      } catch (e) {}
    });

    this.startBlinkingLoop();
    this.getVoltageLevel();
  }

  getVoltageLevel() {
    this.voltageTimer && clearTimeout(this.voltageTimer);
    this.uiSocketService.sendCommand('power', 'getValue');
    this.voltageTimer = setTimeout(() => this.getVoltageLevel(), 30000);
  }

  ngOnDestroy() {
    clearInterval(this.voltageTimer);
    clearInterval(this.blinkTimer);
    clearInterval(this.idleTimer);
  }

  startHold() {
    this.holdTimer = setTimeout(() => {
      this.router.navigate(['/menu']);
    }, 2000);
  }

  endHold() {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  onMouseMove(e: MouseEvent) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const x = (e.clientX / width) * 2 - 1;
    const y = (e.clientY / height) * 2 - 1;

    this.pupilOffset.set({ x: x * 15, y: y * 15 });
  }

  onDoubleClick() {
    this.router.navigate(['/menu']);
  }

  private startBlinkingLoop() {
    const nextBlinkTime = 2000 + Math.random() * 4000;

    this.blinkTimer = setTimeout(() => {
      this.blink();
      this.startBlinkingLoop();
    }, nextBlinkTime);
  }

  private blink() {
    this.isBlinking.set(true);

    setTimeout(() => {
      this.isBlinking.set(false);
    }, 200);
  }
}
