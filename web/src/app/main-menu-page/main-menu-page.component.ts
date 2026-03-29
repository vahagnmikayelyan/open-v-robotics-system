import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { LucideAngularModule, Plus, QrCode, Settings, Wrench } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { ProgramCardComponent } from '../../components/program-card/program-card.component';
import { NotificationService } from '../../services/notification.service';
import { UiSocketService } from '../../services/ui-socket.service';
import { UiLoaderComponent } from '../../components/ui-loader/ui-loader.component';
import { PromptButton, PromptService } from '../../services/prompt.service';
import * as QRCode from 'qrcode';
import { IModule, IProgram } from '../../models/models';

@Component({
  selector: 'main-menu-page',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, NgFor, NgIf, UiLoaderComponent, ProgramCardComponent],
  templateUrl: './main-menu-page.component.html',
  styleUrl: './main-menu-page.component.less',
})
export class MainMenuPageComponent implements OnInit {
  private router = inject(Router);
  private api = inject(ApiService);
  private notifications = inject(NotificationService);
  private prompt = inject(PromptService);
  private uiSocketService = inject(UiSocketService);
  readonly LucideIcons = { QrCode, Settings, Wrench, Plus };
  isConnectDialogOpen = signal(false);
  connectionString = signal<string>('');
  qrImageUrl = signal<string>('');

  isLoading = signal(true);
  totalModules = signal<number>(0);
  programs = signal<IProgram[]>([]);

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

  async ngOnInit() {
    await this.getModules();
    await this.getPrograms();
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

  async getModules() {
    try {
      const availableModules = await this.api.get<IModule[]>('/modules');
      this.totalModules.set(availableModules.length);
    } catch (error: any) {
      this.notifications.error(error.message);
    }
  }

  async getPrograms() {
    try {
      this.isLoading.set(true);
      const programs = await this.api.get<IProgram[]>('/programs');
      this.programs.set(programs);
    } catch (error: any) {
      this.notifications.error(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  startProgram(id: number) {
    this.uiSocketService.runProgram(id);
    this.router.navigate(['/']);
  }

  createProgram() {
    this.router.navigate(['/program', 'new']);
  }

  editProgram(id: number) {
    this.router.navigate(['/program', id]);
  }

  requestDeleteProgram(id: number) {
    this.prompt
      .open('error', 'Delete program?', 'Are you sure?', [PromptButton.Cancel, PromptButton.Delete])
      .subscribe(async (button: PromptButton) => {
        if (button === PromptButton.Delete) {
          try {
            await this.api.delete(`/programs/${id}`);
            this.programs.update((progs) => progs.filter((p) => p.id !== id));
            this.notifications.success('Program deleted successfully');
          } catch (error: any) {
            this.notifications.error(error.message);
          }
        }
      });
  }
}
