import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpeakerChannel = 'L' | 'R' | 'C';

@Component({
  selector: 'speaker-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speaker-test.component.html',
  styleUrl: './speaker-test.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeakerTestComponent {
  activeChannel = signal<SpeakerChannel | null>(null);
  command = output<SpeakerChannel>();

  toggle(channel: SpeakerChannel) {
    if (this.activeChannel() !== null) {
      return;
    }

    this.activeChannel.set(channel);
    this.command.emit(channel);
    setTimeout(() => this.activeChannel.set(null), 1000);
  }
}
