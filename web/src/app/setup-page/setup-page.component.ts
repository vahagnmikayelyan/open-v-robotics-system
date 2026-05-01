import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { IConfig, IConfigGroup, IConfigResponse } from '../../models/models';
import { environment } from '../../environments/environment';
import { ConfigFieldComponent } from '../../components/config-field/config-field.component';

@Component({
  selector: 'setup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfigFieldComponent],
  templateUrl: './setup-page.component.html',
  styleUrl: './setup-page.component.less',
})
export class SetupPageComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  platformVersion = signal<string>('');
  configs = signal<Record<string, unknown>>({});
  schema = signal<IConfigGroup[]>([]);

  ngOnInit() {
    this.getConfigs();
    this.platformVersion.set(environment.version);
  }

  async getConfigs() {
    try {
      const response = await this.api.get<IConfigResponse>('/config');
      const uiConfigs = response.configs.reduce((acc: Record<string, unknown>, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
      this.configs.set(uiConfigs);
      this.schema.set(response.schema);
    } catch (error: any) {
      this.notifications.error(error.message);
    }
  }

  updateConfig(key: string, value: unknown) {
    this.configs.update((current) => ({ ...current, [key]: value }));
  }

  async save() {
    try {
      const updatedConfigs = Object.keys(this.configs()).map((key) => ({ key, value: this.configs()[key] }));
      await this.api.put<IConfig[]>('/config', updatedConfigs);
      this.notifications.success('Configs updated successfully');
    } catch (error: any) {
      this.notifications.error(error.message);
    }
  }
}
