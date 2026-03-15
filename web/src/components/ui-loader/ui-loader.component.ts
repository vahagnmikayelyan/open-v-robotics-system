import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ui-loader',
  standalone: true,
  imports: [],
  templateUrl: './ui-loader.component.html',
  styleUrl: './ui-loader.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiLoaderComponent {}
