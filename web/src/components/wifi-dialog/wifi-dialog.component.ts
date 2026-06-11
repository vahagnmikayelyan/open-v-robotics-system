import { Component, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { LucideAngularModule, Wifi, RefreshCw } from 'lucide-angular';
import { UiLoaderComponent } from '../ui-loader/ui-loader.component';
import { DragScrollDirective } from '../../directives/drag-scroll.directive';

@Component({
  selector: 'wifi-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, UiLoaderComponent, DragScrollDirective],
  templateUrl: './wifi-dialog.component.html',
  styleUrl: './wifi-dialog.component.less',
})
export class WifiDialogComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  readonly LucideIcons = { Wifi, RefreshCw };

  isScanning = signal(false);
  isConnecting = signal(false);
  wifiNetworks = signal<any[]>([]);
  activeWifi = signal<string | null>(null);
  wifiPassword = signal<string>('');
  selectedSsid = signal<string | null>(null);

  ngOnInit() {
    this.loadWifiStatus();
    this.scanWifi();
  }

  async loadWifiStatus() {
    try {
      const status = await this.api.get<{ connected: boolean; ssid: string | null }>('/utils/wifi/status');
      this.activeWifi.set(status.ssid);
    } catch (error: any) {
      console.error('Failed to load Wi-Fi status:', error);
    }
  }

  async scanWifi() {
    try {
      this.isScanning.set(true);
      this.wifiNetworks.set([]); // Clear current list to show the loading indicator
      const networks = await this.api.get<any[]>('/utils/wifi/scan');
      this.wifiNetworks.set(networks);
    } catch (error: any) {
      this.notifications.error(error.message || 'Failed to scan Wi-Fi networks');
    } finally {
      this.isScanning.set(false);
    }
  }

  toggleNetworkSelect(ssid: string) {
    if (this.selectedSsid() === ssid) {
      this.selectedSsid.set(null);
    } else {
      this.selectedSsid.set(ssid);
      this.wifiPassword.set('');
    }
  }

  async connectWifi(ssid: string) {
    if (!ssid) return;
    try {
      this.isConnecting.set(true);
      await this.api.post('/utils/wifi/connect', {
        ssid,
        password: this.wifiPassword()
      });
      this.notifications.success(`Successfully connected to ${ssid}`);
      this.selectedSsid.set(null);
      this.wifiPassword.set('');
      await this.loadWifiStatus();
    } catch (error: any) {
      this.notifications.error(error.message || 'Failed to connect to Wi-Fi');
    } finally {
      this.isConnecting.set(false);
    }
  }

  onClose() {
    this.close.emit();
  }
}
