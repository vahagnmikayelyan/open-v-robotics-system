import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IModuleCommand } from '../../models/models';

type SpeakerChannel = 'L' | 'R' | 'C';

@Component({
  selector: 'speaker-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speaker-widget.component.html',
  styleUrl: './speaker-widget.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeakerWidgetComponent {
  activeChannel = signal<SpeakerChannel | null>(null);
  command = output<IModuleCommand>();

  toggle(channel: SpeakerChannel) {
    if (this.activeChannel() !== null) {
      return;
    }

    this.activeChannel.set(channel);
    this.command.emit({ module: 'speaker', action: 'testSpeaker', params: { channel } });
    setTimeout(() => this.activeChannel.set(null), 1000);
  }
}
