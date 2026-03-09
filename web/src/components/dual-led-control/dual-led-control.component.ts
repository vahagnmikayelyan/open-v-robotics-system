import { Component, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface LedState {
    left: number; // 0-100
    right: number; // 0-100
}

@Component({
    selector: 'dual-led-control',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dual-led-control.component.html',
    styleUrl: './dual-led-control.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DualLedControlComponent {
    leftLed = signal(0);
    rightLed = signal(0);
    isLinked = signal(true);

    changeValues = output<LedState>();

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
        this.isLinked.update(v => !v);
        // If link enabled, synchronizing values
        if (this.isLinked()) this.leftLed.set(this.rightLed());
        this.sendChanges();
    }

    private sendChanges() {
        this.changeValues.emit({ left: this.leftLed(), right: this.rightLed() });
    }

    // Icons Glow Effect
    getGlow(val: number) {
        const opacity = 0.2 + (val / 100) * 0.8;
        const shadow = val > 10 ? `0 0 ${val/5}px rgba(255,255,255,0.8)` : 'none';
        return { opacity, filter: `drop-shadow(${shadow})` };
    }
}
