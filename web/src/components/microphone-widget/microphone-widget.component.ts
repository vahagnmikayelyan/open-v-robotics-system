import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Mic, Circle, Volume2 } from 'lucide-angular';
import { ModuleCommand } from '../../models/models';

@Component({
  selector: 'microphone-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './microphone-widget.component.html',
  styleUrl: './microphone-widget.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrophoneWidgetComponent {
  readonly LucideIcons = { Mic, Circle, Volume2 };

  status = signal<'idle' | 'recording' | 'playback'>('idle');
  duration = signal<number>(10);
  timeLeft = signal(0);
  command = output<ModuleCommand>();

  startLoopback() {
    if (this.status() !== 'idle') return;

    this.command.emit({ module: 'microphone', action: 'testMicrophone', params: { duration: this.duration() } });

    this.status.set('recording');
    this.timeLeft.set(this.duration());

    const interval = setInterval(() => {
      this.timeLeft.update((t) => t - 1);
      if (this.timeLeft() === 0) {
        clearInterval(interval);
        this.endLoopback();
      }
    }, 1000);
  }

  private endLoopback() {
    console.log('endLoopback');
    this.status.set('playback');
    setTimeout(() => this.startSpeaker(), 1000);
  }

  private startSpeaker() {
    this.command.emit({ module: 'speaker', action: 'testSpeaker', params: { channel: 'T' } });
    setTimeout(() => this.status.set('idle'), this.duration() * 1000);
  }
}
