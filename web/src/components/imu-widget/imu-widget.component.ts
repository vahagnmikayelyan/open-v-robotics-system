import { Component, input, model, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MpuData {
  accel: { x: number, y: number, z: number }; // G-Force
  gyro: { x: number, y: number, z: number };  // Deg/Sec
}

@Component({
  selector: 'imu-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imu-widget.component.html',
  styleUrl: './imu-widget.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImuWidgetComponent {
  data = input.required<MpuData>();
  isActive = model(false);

  dotTransform = computed(() => {
    const { x, y } = this.data().accel;

    const GRAVITY = 9.8;
    const multiplier = 35;

    let cssX = (y / GRAVITY) * multiplier;
    let cssY = (x / GRAVITY) * multiplier * -1;

    const radius = 28;
    const distance = Math.sqrt(cssX * cssX + cssY * cssY);

    if (distance > radius) {
      cssX = (cssX / distance) * radius;
      cssY = (cssY / distance) * radius;
    }

    return `translate(${cssX}px, ${cssY}px)`;
  });

  toggleStream() {
    this.isActive.update(v => !v);
  }
}
