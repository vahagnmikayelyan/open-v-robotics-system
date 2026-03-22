import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'battery-status',
  standalone: true,
  imports: [],
  templateUrl: './battery-status.component.html',
  styleUrl: './battery-status.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatteryStatusComponent {
  level = input.required<number>();

  statusClass = computed(() => {
    const val = this.level();
    if (val <= 20) return 'critical';
    if (val <= 50) return 'warning';
    return 'normal';
  });
}
