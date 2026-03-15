import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Settings, Wrench } from 'lucide-angular';

@Component({
  selector: 'main-menu-page',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './main-menu-page.component.html',
  styleUrl: './main-menu-page.component.less',
})
export class MainMenuPageComponent {
  readonly LucideIcons = { Settings, Wrench };
}
