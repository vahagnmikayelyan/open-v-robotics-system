import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiSocketService } from '../services/ui-socket.service';
import { NotificationComponent } from '../components/notification/notification.component';
import { PromptDialogComponent } from '../components/prompt-dialog/prompt-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationComponent, PromptDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
})
export class AppComponent implements OnInit {
  private uiSocketService = inject(UiSocketService);

  ngOnInit() {
    this.uiSocketService.init();
  }
}
