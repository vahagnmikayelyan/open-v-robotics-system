import { Component, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { LucideAngularModule, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-angular';

@Component({
  selector: 'notification',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, LucideAngularModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.less',
})
export class NotificationComponent {
  public notifications = inject(NotificationService);

  readonly LucideIcons = { CheckCircle, XCircle, Info, AlertTriangle };

  close(id: number) {
    this.notifications.remove(id);
  }
}
