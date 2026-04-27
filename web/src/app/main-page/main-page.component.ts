import { Component, DestroyRef, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UiSocketService } from '../../services/ui-socket.service';
import { BatteryStatusComponent } from '../../components/battery-status/battery-status.component';
import { IProgram } from '../../models/models';
import { NgIf } from '@angular/common';

@Component({
  selector: 'main-page',
  standalone: true,
  imports: [BatteryStatusComponent, NgIf],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.less',
})
export class MainPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  pupilOffset = signal({ x: 0, y: 0 });
  isBlinking = signal(false);
  batteryLevel = signal(0);
  runningProgram = signal<IProgram | null>(null);
  displayMedia = signal<{ type: 'image' | 'video' | 'map'; url: string } | null>(null);

  private blinkTimer: any;
  private idleTimer: any;
  private holdTimer: any;
  private voltageTimer: any;

  constructor(private uiSocketService: UiSocketService) {}

  ngOnInit() {
    this.uiSocketService.onProgramChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.runningProgram.set(state);
    });

    this.uiSocketService.onInit.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.getVoltageLevel();
      this.uiSocketService.getRunningProgram();
    });

    this.uiSocketService.onCommandResult.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((commandResult) => {
      try {
        if (commandResult && commandResult.hasOwnProperty('module') && commandResult.module === 'power') {
          this.batteryLevel.set(commandResult.p);
        }
      } catch (e) {}
    });

    this.startBlinkingLoop();
    this.getVoltageLevel();
    this.uiSocketService.getRunningProgram();

    this.uiSocketService.onModuleEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      console.log('Module event:', event);
      if (event.command === 'showImage') {
        const url = event.params['url'] as string;
        this.displayMedia.set({ type: 'image', url });
      } else if (event.command === 'clearScreen') {
        this.displayMedia.set(null);
      }
    });
  }

  getVoltageLevel() {
    this.voltageTimer && clearTimeout(this.voltageTimer);
    this.uiSocketService.sendCommand('power', 'getValue', null);
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

  stopRunningProgram() {
    this.uiSocketService.stopRunningProgram();
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
