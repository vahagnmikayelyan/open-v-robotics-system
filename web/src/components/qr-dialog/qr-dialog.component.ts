import { Component, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { UiLoaderComponent } from '../ui-loader/ui-loader.component';
import * as QRCode from 'qrcode';

@Component({
  selector: 'qr-dialog',
  standalone: true,
  imports: [CommonModule, UiLoaderComponent],
  templateUrl: './qr-dialog.component.html',
  styleUrl: './qr-dialog.component.less',
})
export class QrDialogComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  connectionString = signal<string>('');
  qrImageUrl = signal<string>('');

  ngOnInit() {
    this.loadConnectionInfo();
  }

  async loadConnectionInfo() {
    try {
      const info = await this.api.get<{ ip: string }>('/utils/connection');
      this.connectionString.set(`http://${info.ip}:${location.port}`);
      await this.generateQR(this.connectionString());
    } catch (err: any) {
      this.notifications.error("Can't receive platform ip");
    }
  }

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

  onClose() {
    this.close.emit();
  }
}
