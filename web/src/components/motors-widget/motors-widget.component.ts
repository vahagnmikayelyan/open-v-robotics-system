import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RotateCcw, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-angular';
import { ModuleCommand } from '../../models/models';

interface WheelsState {
  fl: number;
  fr: number;
  bl: number;
  br: number;
}

const defaultStates: WheelsState = { fl: 0, fr: 0, bl: 0, br: 0 };

@Component({
  selector: 'motors-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './motors-widget.component.html',
  styleUrl: './motors-widget.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MotorsWidgetComponent {
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
  wheelsState = signal<WheelsState>({ ...defaultStates });

  command = output<ModuleCommand>();

  private toState(frontLeft: number, frontRight: number, backLeft: number, backRight: number) {
    return { fl: frontLeft, fr: frontRight, bl: backLeft, br: backRight };
  }

  private sendCommand() {
    const params = [this.wheelsState().fl, this.wheelsState().fr, this.wheelsState().bl, this.wheelsState().br];
    this.command.emit({ module: 'drive', action: 'control', params });
  }

  startWheel(id: string) {
    this.wheelsState.set({ ...defaultStates, [id]: this.direction() * this.speed() });
    this.currentAction.set(id);
    this.sendCommand();
  }

  rotateLeft() {
    this.wheelsState.set(this.toState(-1 * this.speed(), this.speed(), -1 * this.speed(), this.speed()));
    this.currentAction.set('rotateLeft');
    this.sendCommand();
  }

  rotateRight() {
    this.wheelsState.set(this.toState(this.speed(), -1 * this.speed(), this.speed(), -1 * this.speed()));
    this.currentAction.set('rotateLeft');
    this.sendCommand();
  }

  spinLeft() {
    this.wheelsState.set(this.toState(-1 * this.speed(), this.speed(), this.speed(), -1 * this.speed()));
    this.currentAction.set('spinLeft');
    this.sendCommand();
  }

  spinRight() {
    this.wheelsState.set(this.toState(this.speed(), -1 * this.speed(), -1 * this.speed(), this.speed()));
    this.currentAction.set('spinRight');
    this.sendCommand();
  }

  forward() {
    this.wheelsState.set(this.toState(this.speed(), this.speed(), this.speed(), this.speed()));
    this.currentAction.set('forward');
    this.sendCommand();
  }

  backward() {
    this.wheelsState.set(this.toState(-1 * this.speed(), -1 * this.speed(), -1 * this.speed(), -1 * this.speed()));
    this.currentAction.set('backward');
    this.sendCommand();
  }

  stop(force: boolean = false) {
    if (this.currentAction() === null && !force) {
      return;
    }

    this.wheelsState.set({ ...defaultStates });
    this.currentAction.set(null);
    this.sendCommand();
  }

  getWheelClass(id: 'fl' | 'fr' | 'bl' | 'br') {
    const state = this.wheelsState()[id];
    if (state > 0) return 'fwd';
    if (state < 0) return 'bwd';
    return '';
  }
}
