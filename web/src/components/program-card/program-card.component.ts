import { Component, input, output } from '@angular/core';
import { LucideAngularModule, Zap } from 'lucide-angular';
import { IProgram } from '../../models/models';

@Component({
  selector: 'program-card',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './program-card.component.html',
  styleUrl: './program-card.component.less',
})
export class ProgramCardComponent {
  program = input.required<IProgram>();
  totalModules = input(0);

  select = output<number>();
  edit = output<number>();
  deleteRequest = output<number>();

  readonly LucideIcons = { Zap };

  onSelect(): void {
    this.select.emit(this.program().id);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.program().id);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteRequest.emit(this.program().id);
  }
}
