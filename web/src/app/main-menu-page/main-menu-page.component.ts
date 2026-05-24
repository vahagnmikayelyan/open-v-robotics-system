import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { LucideAngularModule, Plus, QrCode, Settings, Wrench, Download, Upload } from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { ProgramCardComponent } from '../../components/program-card/program-card.component';
import { NotificationService } from '../../services/notification.service';
import { UiSocketService } from '../../services/ui-socket.service';
import { UiLoaderComponent } from '../../components/ui-loader/ui-loader.component';
import { PromptButton, PromptService } from '../../services/prompt.service';
import * as QRCode from 'qrcode';
import { IModule, IProgram } from '../../models/models';
import { DragScrollDirective } from '../../directives/drag-scroll.directive';

@Component({
  selector: 'main-menu-page',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, NgFor, NgIf, UiLoaderComponent, ProgramCardComponent, DragScrollDirective],
  templateUrl: './main-menu-page.component.html',
  styleUrl: './main-menu-page.component.less',
})
export class MainMenuPageComponent implements OnInit {
  private router = inject(Router);
  private api = inject(ApiService);
  private notifications = inject(NotificationService);
  private prompt = inject(PromptService);
  private uiSocketService = inject(UiSocketService);
  readonly LucideIcons = { QrCode, Settings, Wrench, Plus, Download, Upload };
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

  exportAllPrograms() {
    if (!this.programs().length) {
      this.notifications.error('No programs to export.');
      return;
    }

    const apiBase = `${location.protocol}//${location.hostname}:${location.port}`;
    const a = document.createElement('a');
    a.href = `${apiBase}/api/programs/export`;
    a.download = '';
    a.click();

    this.notifications.success(`${this.programs().length} program(s) exported.`);
  }

  exportSingleProgram(program: IProgram) {
    const exportData: Omit<IProgram, 'id'> & { exportedAt: string } = {
      name: program.name,
      systemInstruction: program.systemInstruction,
      aiModel: program.aiModel,
      voice: program.voice,
      modules: program.modules,
      moduleConfigs: program.moduleConfigs,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${program.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_program.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.notifications.success(`Program "${program.name}" exported successfully.`);
  }

  importProgram(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const items: any[] = Array.isArray(raw) ? raw : [raw];

        const result = await this.api.post<{ imported: number; skipped: number; errors: string[] }>(
          '/programs/import',
          items,
        );

        if (result.imported > 0) {
          this.notifications.success(`${result.imported} program(s) imported successfully.`);
        }
        if (result.skipped > 0) {
          this.notifications.error(`${result.skipped} program(s) skipped: ${result.errors.join('; ')}`);
        }

        await this.getPrograms();
      } catch {
        this.notifications.error('Failed to parse the file. Make sure it is a valid JSON.');
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file);
  }
}
