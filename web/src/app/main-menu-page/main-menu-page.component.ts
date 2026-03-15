import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LucideAngularModule, QrCode, Settings, Wrench, Zap, Plus } from 'lucide-angular';
import { NotificationService } from '../../services/notification.service';
import { UiLoaderComponent } from '../../components/ui-loader/ui-loader.component';
import * as QRCode from 'qrcode';
import { NgIf } from '@angular/common';

@Component({
  selector: 'main-menu-page',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, NgIf, UiLoaderComponent],
  templateUrl: './main-menu-page.component.html',
  styleUrl: './main-menu-page.component.less',
})
export class MainMenuPageComponent {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);
  readonly LucideIcons = { QrCode, Settings, Wrench, Zap, Plus };
  isConnectDialogOpen = signal(false);
  connectionString = signal<string>('');
  qrImageUrl = signal<string>('');

  async generateQR(text: string) {
    try {
      const url = await QRCode.toDataURL(text, {
        width: 180,
        margin: 2,
        color: { dark: '#00d4ff', light: '#111111' },
      });
      this.qrImageUrl.set(url);
    } catch (err) {
      this.notifications.error('QR generation error');
      console.error('QR generation error:', err);
    }
  }

  async openConnectDialog() {
    this.isConnectDialogOpen.set(true);
    this.qrImageUrl.set('');

    try {
      const info = await this.api.get<{ ip: string }>('/utils/connection');
      this.connectionString.set(`http://${info.ip}:${location.port}`);
      this.generateQR(this.connectionString());
    } catch (err: any) {
      this.notifications.error("Can't receive platform ip");
    }
  }

  closeConnectDialog() {
    this.isConnectDialogOpen.set(false);
    this.qrImageUrl.set('');
  }
}
