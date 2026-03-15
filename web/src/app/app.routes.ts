import { Routes } from '@angular/router';
import { DevToolsPageComponent } from './dev-tools-page/dev-tools-page.component';
import { SetupPageComponent } from './setup-page/setup-page.component';
import { MainMenuPageComponent } from './main-menu-page/main-menu-page.component';

export const routes: Routes = [
  { path: '', component: MainMenuPageComponent },
  { path: 'setup', component: SetupPageComponent },
  { path: 'devtools', component: DevToolsPageComponent },
  { path: '**', redirectTo: '' },
];
