import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RangeInputComponent } from '../range-input/range-input.component';

@Component({
  selector: 'ui-slider',
  standalone: true,
  imports: [FormsModule, RangeInputComponent],
  templateUrl: './ui-slider.component.html',
  styleUrl: './ui-slider.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiSliderComponent {
  label = input.required<string>();
  value = model.required<number>();
  min = input<number>(0);
  max = input<number>(100);
  step = input<number>(1);
  unit = input<string>('%');
}
