import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IConfigItem } from '../../models/models';

@Component({
  selector: 'config-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-field.component.html',
  styleUrl: './config-field.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ConfigFieldComponent),
      multi: true,
    },
  ],
})
export class ConfigFieldComponent implements ControlValueAccessor {
  @Input() config!: IConfigItem;
  @Input() name: string = '';
  @Input() required: boolean = false;

  private _value: any;
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  get value(): any {
    return this._value;
  }

  set value(newValue: any) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.onChange(newValue);
    }
  }

  get isText(): boolean {
    return !this.config.type || this.config.type === 'text' || this.config.type === 'password';
  }

  get isNumber(): boolean {
    return this.config.type === 'number';
  }

  get isRange(): boolean {
    return this.config.type === 'range';
  }

  get isSelect(): boolean {
    return this.config.type === 'select';
  }

  get isToggle(): boolean {
    return this.config.type === 'toggle';
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this._value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInputBlur() {
    this.onTouched();
  }

  onValueChange(newValue: any) {
    this.value = newValue;
  }

  onToggleChange(checked: boolean) {
    this.value = checked;
  }

  onRangeChange(newValue: number) {
    this.value = newValue;
  }
}
