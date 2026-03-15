import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { IConfig } from '../../models/models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'setup-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './setup-page.component.html',
  styleUrl: './setup-page.component.less',
})
export class SetupPageComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  platformVersion = signal<string>('');
  configs = signal<Record<IConfig['key'], IConfig['value']>>({});

  ngOnInit() {
    this.getConfigs();
    this.platformVersion.set(environment.version);
  }

  async getConfigs() {
    try {
      const configs = await this.api.get<IConfig[]>('/config');
      const uiConfigs = configs.reduce((acc: Record<IConfig['key'], IConfig['value']>, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
      this.configs.set(uiConfigs);
    } catch (error: any) {
      this.notifications.error(error.message);
    }
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
