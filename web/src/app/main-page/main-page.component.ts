import { Component, computed, DestroyRef, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Volume1, Volume2, VolumeX, Power } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { UiSocketService } from '../../services/ui-socket.service';
import { ApiService } from '../../services/api.service';
import { PromptButton, PromptService } from '../../services/prompt.service';
import { BatteryStatusComponent } from '../../components/battery-status/battery-status.component';
import { IProgram } from '../../models/models';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'main-page',
  standalone: true,
  imports: [BatteryStatusComponent, NgIf, NgFor, LucideAngularModule],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.less',
})
export class MainPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);
  private prompt = inject(PromptService);
  readonly LucideIcons = { Volume2, Volume1, VolumeX, Power };

  pupilOffset = signal({ x: 0, y: 0 });
  isBlinking = signal(false);
  batteryLevel = signal(0);
  runningProgram = signal<IProgram | null>(null);
  displayMedia = signal<{ type: 'image' | 'video' | 'map'; url: string } | null>(null);
  activePoll = signal<{ question?: string; options: string[] } | null>(null);

  isPollAnswered = signal<boolean>(false);

  private blinkTimer: any;
  private idleTimer: any;
  private holdTimer: any;
  private voltageTimer: any;
  private volumePanelTimer: any;
  private volumeDebounceTimer: any;

  volumeLevel = signal(80);
  isMuted = signal(false);
  isVolumePanelOpen = signal(false);

  constructor(private uiSocketService: UiSocketService) { }

  ngOnInit() {
    this.uiSocketService.onProgramChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.runningProgram.set(state);
    });

    this.uiSocketService.onInit.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.getVoltageLevel();
      this.uiSocketService.getRunningProgram();
      this.uiSocketService.sendCommand('speaker', 'getVolume', null);
    });

    this.uiSocketService.onCommandResult.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((commandResult) => {
      try {
        if (commandResult && commandResult.hasOwnProperty('module') && commandResult.module === 'power') {
          this.batteryLevel.set(commandResult.p);
        }
        if (commandResult && commandResult.hasOwnProperty('module') && commandResult.module === 'speaker') {
          this.volumeLevel.set(commandResult.volume);
          this.isMuted.set(commandResult.muted ?? false);
        }
      } catch (e) { }
    });

    this.startBlinkingLoop();
    this.getVoltageLevel();
    this.uiSocketService.getRunningProgram();
    this.uiSocketService.sendCommand('speaker', 'getVolume', null);

    this.uiSocketService.onModuleEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      console.log('Module event:', event);

      if (event.command === 'showImage') {
        const url = event.params['url'] as string;
        this.displayMedia.set({ type: 'image', url });
      } else if (event.command === 'clearScreen') {
        this.clearDisplay();
      } else if (event.command === 'showPoll') {
        const options = event.params['options'] as string[];
        const question = event.params['question'] as string | undefined;
        this.isPollAnswered.set(false);
        this.activePoll.set({ options, question });
      }
    });
  }

  clearDisplay() {
    this.displayMedia.set(null);
    this.activePoll.set(null);
  }

  onPollAnswer(answer: string) {
    if (this.isPollAnswered()) return;
    this.isPollAnswered.set(true);
    this.uiSocketService.sendCommand('poll', 'handleAnswer', { answer });
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
    this.clearVolumePanelTimer();
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
    this.clearDisplay();
    this.uiSocketService.stopRunningProgram();
  }

  volumeIcon = computed(() => {
    if (this.isMuted()) return this.LucideIcons.VolumeX;
    const v = this.volumeLevel();
    if (v < 70) return this.LucideIcons.Volume1;
    return this.LucideIcons.Volume2;
  });

  toggleVolumePanel() {
    const isOpen = this.isVolumePanelOpen();
    this.isVolumePanelOpen.set(!isOpen);
    if (!isOpen) {
      this.resetVolumePanelTimer();
    } else {
      this.clearVolumePanelTimer();
    }
  }

  onVolumeChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.volumeLevel.set(value);
    this.resetVolumePanelTimer();

    clearTimeout(this.volumeDebounceTimer);
    this.volumeDebounceTimer = setTimeout(() => {
      this.uiSocketService.sendCommand('speaker', 'setVolume', { volume: value });
    }, 300);
  }

  toggleMute() {
    this.uiSocketService.sendCommand('speaker', 'toggleMute', null);
    this.resetVolumePanelTimer();
  }

  private resetVolumePanelTimer() {
    this.clearVolumePanelTimer();
    this.volumePanelTimer = setTimeout(() => {
      this.isVolumePanelOpen.set(false);
    }, 5000);
  }

  private clearVolumePanelTimer() {
    if (this.volumePanelTimer) {
      clearTimeout(this.volumePanelTimer);
      this.volumePanelTimer = null;
    }
  }

  openPowerMenu() {
    this.prompt
      .open('warning', 'Power Control', 'Select an action:', [
        PromptButton.Restart,
        PromptButton.PowerOff,
        PromptButton.Cancel,
      ])
      .subscribe(async (button) => {
        if (button === PromptButton.Restart) {
          await this.api.post('/utils/reboot', {});
        } else if (button === PromptButton.PowerOff) {
          await this.api.post('/utils/power-off', {});
        }
      });
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
