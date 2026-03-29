import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IModuleCommand } from '../../models/models';

@Component({
  selector: 'dual-led-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dual-led-widget.component.html',
  styleUrl: './dual-led-widget.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DualLedWidgetComponent {
  leftLed = signal(0);
  rightLed = signal(0);
  isLinked = signal(true);

  command = output<IModuleCommand>();

  updateLeft(v: number) {
    this.leftLed.set(v);
    if (this.isLinked()) this.rightLed.set(v);
    this.sendChanges();
  }

  updateRight(v: number) {
    this.rightLed.set(v);
    if (this.isLinked()) this.leftLed.set(v);
    this.sendChanges();
  }

  toggleLink() {
    this.isLinked.update((v) => !v);
    // If link enabled, synchronizing values
    if (this.isLinked()) this.leftLed.set(this.rightLed());
    this.sendChanges();
  }

  private sendChanges() {
    this.command.emit({
      module: 'light',
      action: 'light',
      params: { leftPercent: this.leftLed(), rightPercent: this.rightLed() },
    });
  }

  // Icons Glow Effect
  getGlow(val: number) {
    const opacity = 0.2 + (val / 100) * 0.8;
    const shadow = val > 10 ? `0 0 ${val / 5}px rgba(255,255,255,0.8)` : 'none';
    return { opacity, filter: `drop-shadow(${shadow})` };
  }
}
