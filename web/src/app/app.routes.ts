import { Routes } from '@angular/router';
import { DevToolsPageComponent } from './dev-tools-page/dev-tools-page.component';

export const routes: Routes = [
  { path: '', component: DevToolsPageComponent },
  { path: '**', redirectTo: '' }
];
