import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notifications = signal<AppNotification[]>([]);
  private counter = 0;

  private addNotification(type: NotificationType, message: string, duration: number = 3000) {
    const id = ++this.counter;
    const notification: AppNotification = { id, type, message };

    this.notifications.update((list) => [...list, notification]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(msg: string) {
    this.addNotification('success', msg);
  }

  error(msg: string) {
    this.addNotification('error', msg);
  }

  info(msg: string) {
    this.addNotification('info', msg);
  }

  warning(msg: string) {
    this.addNotification('warning', msg);
  }

  remove(id: number) {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }
}
