import { Component, ElementRef, forwardRef, HostListener, Input, ViewChild, ChangeDetectionStrategy, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'range-input',
  standalone: true,
  templateUrl: './range-input.component.html',
  styleUrl: './range-input.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.tabindex]': 'disabled ? -1 : 0'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RangeInputComponent),
      multi: true
    }
  ]
})
export class RangeInputComponent implements ControlValueAccessor {
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() disabled: boolean = false;
  @Input() name: string = '';

  constructor(private el: ElementRef<HTMLElement>) {}

  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  percentage = signal(0);
  isActive = signal(false);
  isFocused = signal(false);

  private value = 0;
  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };
  private isDragging = false;

  writeValue(value: any): void {
    if (value !== undefined && value !== null) {
      this.value = Number(value);
      this.updatePercentage();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onPointerDown(event: MouseEvent | TouchEvent) {
    if (this.disabled) return;
    this.el.nativeElement.focus(); // Focus host element to receive keyboard events
    this.isDragging = true;
    this.isActive.set(true);
    this.onTouched();
    this.updateValueFromEvent(event);

    // Prevent default to avoid scrolling while dragging on touch screens
    if (event.cancelable) {
      event.preventDefault();
    }
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onPointerMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    this.updateValueFromEvent(event);
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  @HostListener('window:touchcancel')
  onPointerUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.isActive.set(false);
    }
  }

  @HostListener('focus')
  onFocus() {
    this.isFocused.set(true);
  }

  @HostListener('blur')
  onBlur() {
    this.isFocused.set(false);
    this.onTouched();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.disabled) return;

    let newValue = Number(this.value);
    const step = Number(this.step) || 1;
    const pageStep = step * 10;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue += step;
        event.preventDefault();
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue -= step;
        event.preventDefault();
        break;
      case 'PageUp':
        newValue += pageStep;
        event.preventDefault();
        break;
      case 'PageDown':
        newValue -= pageStep;
        event.preventDefault();
        break;
      case 'Home':
        newValue = this.min;
        event.preventDefault();
        break;
      case 'End':
        newValue = this.max;
        event.preventDefault();
        break;
      default:
        return;
    }

    this.setValue(newValue);
  }

  private updateValueFromEvent(event: MouseEvent | TouchEvent) {
    if (!this.container) return;

    const rect = this.container.nativeElement.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;

    // Calculate percentage based on mouse/touch position
    let x = clientX - rect.left;
    let newPercentage = x / rect.width;

    // Clamp between 0 and 1
    newPercentage = Math.max(0, Math.min(1, newPercentage));

    // Map to value range
    let newValue = this.min + newPercentage * (this.max - this.min);

    // Apply step
    if (this.step) {
      const steps = Math.round((newValue - this.min) / this.step);
      newValue = this.min + steps * this.step;
    }

    this.setValue(newValue);
  }

  private setValue(newValue: number) {
    // Clamp to min/max
    newValue = Math.max(this.min, Math.min(this.max, newValue));

    if (this.value !== newValue) {
      this.value = newValue;
      this.updatePercentage();
      this.onChange(newValue);
    }
  }

  private updatePercentage() {
    const min = Number(this.min) || 0;
    const max = Number(this.max) || 100;
    const val = Number(this.value) || 0;

    let pct = ((val - min) / (max - min)) * 100;
    pct = Math.max(0, Math.min(100, pct));
    this.percentage.set(pct);
  }
}
