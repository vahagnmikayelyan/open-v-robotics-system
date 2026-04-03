import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RotateCcw, RotateCw, ArrowUp, ArrowDown } from 'lucide-angular';
import { ModuleCommandParams, IModuleCommand } from '../../models/models';

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
  };

  speed = signal<number>(70);
  distance = signal<number>(200);
  angle = signal<number>(90);
  direction = signal<number>(1);
  currentAction = signal<string | null>(null);
  wheelsState = signal<WheelsState>({ ...defaultStates });

  command = output<IModuleCommand>();

  private toState(frontLeft: number, frontRight: number, backLeft: number, backRight: number) {
    return { fl: frontLeft, fr: frontRight, bl: backLeft, br: backRight };
  }

  private sendMoveCommand() {
    this.command.emit({
      module: 'drive',
      action: 'control',
      params: this.wheelsState() as unknown as ModuleCommandParams,
    });
  }

  toggleDirection() {
    this.direction.set(this.direction() === 1 ? -1 : 1);
  }

  startWheel(id: string) {
    this.wheelsState.set({ ...defaultStates, [id]: this.direction() * this.speed() });
    this.currentAction.set(id);
    this.sendMoveCommand();
  }

  rotateLeft() {
    this.wheelsState.set(this.toState(-1 * this.speed(), this.speed(), -1 * this.speed(), this.speed()));
    this.currentAction.set('rotateLeft');
    this.sendMoveCommand();
  }

  rotateRight() {
    this.wheelsState.set(this.toState(this.speed(), -1 * this.speed(), this.speed(), -1 * this.speed()));
    this.currentAction.set('rotateRight');
    this.sendMoveCommand();
  }

  forward() {
    this.wheelsState.set(this.toState(this.speed(), this.speed(), this.speed(), this.speed()));
    this.currentAction.set('forward');
    this.sendMoveCommand();
  }

  backward() {
    this.wheelsState.set(this.toState(-1 * this.speed(), -1 * this.speed(), -1 * this.speed(), -1 * this.speed()));
    this.currentAction.set('backward');
    this.sendMoveCommand();
  }

  stop(force: boolean = false) {
    if (this.currentAction() === null && !force) {
      return;
    }

    this.wheelsState.set({ ...defaultStates });
    this.currentAction.set(null);
    this.command.emit({
      module: 'drive',
      action: 'stop',
      params: {},
    });
  }

  moveDistance(direction: 1 | -1) {
    this.command.emit({
      module: 'drive',
      action: 'moveDistance',
      params: { speed: this.speed(), distance: direction * this.distance() },
    });
  }

  rotateByAngle(direction: 1 | -1) {
    this.command.emit({
      module: 'drive',
      action: 'rotateAngle',
      params: { speed: this.speed(), angle: direction * this.angle() },
    });
  }

  getWheelClass(id: 'fl' | 'fr' | 'bl' | 'br') {
    const state = this.wheelsState()[id];
    if (state > 0) return 'fwd';
    if (state < 0) return 'bwd';
    return '';
  }
}
