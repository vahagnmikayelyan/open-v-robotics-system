import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'sensor-tile',
  standalone: true,
  imports: [NgIf],
  templateUrl: './sensor-tile.component.html',
  styleUrl: './sensor-tile.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SensorTileComponent {
  label = input.required<string>();
  valueMain = input.required<number | string>();
  valueSec = input<number | string | null>(null);
  unit = input<string>('');
  unitSec = input<string>('');
  isActive = model<boolean>(false);

  toggle() {
    this.isActive.update(v => !v);
  }
}
