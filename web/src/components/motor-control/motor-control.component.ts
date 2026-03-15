import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RotateCcw, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-angular';

interface Wheels {
  fl: number;
  fr: number;
  bl: number;
  br: number;
}

export interface MotorCommand {
  type: 'control' | 'stop';
  data: Wheels;
}

const defaultStates: Wheels = { fl: 0, fr: 0, bl: 0, br: 0 };

@Component({
  selector: 'motor-control',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './motor-control.component.html',
  styleUrl: './motor-control.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MotorControlComponent {
  readonly LucideIcons = {
    RotateCcw,
    RotateCw,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
  };

  speed = signal<number>(70);
  direction = signal<number>(1);
  currentAction = signal<string | null>(null);
  wheelsStates = signal<Wheels>({ ...defaultStates });

  command = output<MotorCommand>();

  private getCommand(frontLeft: number, frontRight: number, backLeft: number, backRight: number) {
    return { fl: frontLeft, fr: frontRight, bl: backLeft, br: backRight };
  }

  startWheel(id: string) {
    this.wheelsStates.set({ ...defaultStates, [id]: this.direction() * this.speed() });
    this.currentAction.set(id);
    this.command.emit({ type: 'control', data: this.wheelsStates() });
  }

  rotateLeft() {
    this.wheelsStates.set(this.getCommand(-1 * this.speed(), this.speed(), -1 * this.speed(), this.speed()));
    this.currentAction.set('rotateLeft');
    this.command.emit({ type: 'control', data: this.wheelsStates() });
  }

  rotateRight() {
    this.wheelsStates.set(this.getCommand(this.speed(), -1 * this.speed(), this.speed(), -1 * this.speed()));
    this.currentAction.set('rotateLeft');
    this.command.emit({ type: 'control', data: this.wheelsStates() });
  }

  spinLeft() {
    this.wheelsStates.set(this.getCommand(-1 * this.speed(), this.speed(), this.speed(), -1 * this.speed()));
    this.currentAction.set('spinLeft');
    this.command.emit({ type: 'control', data: this.wheelsStates() });
  }

  spinRight() {
    this.wheelsStates.set(this.getCommand(this.speed(), -1 * this.speed(), -1 * this.speed(), this.speed()));
    this.currentAction.set('spinRight');
    this.command.emit({ type: 'control', data: this.wheelsStates() });
  }

  forward() {
    this.wheelsStates.set(this.getCommand(this.speed(), this.speed(), this.speed(), this.speed()));
    this.currentAction.set('forward');
    this.command.emit({ type: 'control', data: this.wheelsStates() });
  }

  backward() {
    this.wheelsStates.set(this.getCommand(-1 * this.speed(), -1 * this.speed(), -1 * this.speed(), -1 * this.speed()));
    this.currentAction.set('backward');
    this.command.emit({ type: 'control', data: this.wheelsStates() });
  }

  stop(force: boolean = false) {
    if (this.currentAction() === null && !force) {
      return;
    }

    this.wheelsStates.set({ ...defaultStates });
    this.currentAction.set(null);
    this.command.emit({ type: 'control', data: this.wheelsStates() });
  }

  getWheelClass(id: 'fl' | 'fr' | 'bl' | 'br') {
    const state = this.wheelsStates()[id];
    if (state > 0) return 'fwd'; // Green
    if (state < 0) return 'bwd'; // Red
    return '';
  }
}
