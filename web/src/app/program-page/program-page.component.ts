import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, UpperCasePipe } from '@angular/common';
import { LucideAngularModule, Settings } from 'lucide-angular';
import { IAIModelConfig, IModule, IModuleCategory, IProgram } from '../../models/models';
import { ApiService } from '../../services/api.service';
import { UiLoaderComponent } from '../../components/ui-loader/ui-loader.component';
import { ConfigFieldComponent } from '../../components/config-field/config-field.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'program-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    UiLoaderComponent,
    ConfigFieldComponent,
    NgIf,
    NgFor,
    UpperCasePipe,
    LucideAngularModule,
  ],
  templateUrl: './program-page.component.html',
  styleUrl: './program-page.component.less',
})
export class ProgramPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  isLoading = signal(true);

  program = signal<IProgram>({
    id: 0,
    name: '',
    systemInstruction: '',
    aiModel: '',
    voice: '',
    modules: [],
    moduleConfigs: {},
  });

  aiModels: IAIModelConfig[] = [];
  moduleCategories: IModuleCategory[] = [];
  availableModules: IModule[] = [];
  requiredModules: Set<string> = new Set();
  aiVoices: string[] = [];
  expandedSettings = signal<Set<string>>(new Set());

  readonly LucideIcons = { Settings };

  constructor() {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    await Promise.all([this.getAIModels(), this.getModules()]);

    if (id && id !== 'new') {
      await this.getProgram(id);
    } else {
      this.isLoading.set(false);
    }
  }

  hasModule(moduleId: string): boolean {
    return this.program().modules.includes(moduleId);
  }

  isRequiredModule(moduleId: string): boolean {
    return this.requiredModules.has(moduleId);
  }

  onAIModelChange(modelId: string, updateState: boolean = true) {
    const selectedModel = this.aiModels.find((model) => model.id === modelId);

    if (!selectedModel) {
      return;
    }

    this.requiredModules = new Set(selectedModel.requiredModules ?? []);
    this.aiVoices = selectedModel.voices ?? [];

    if (!updateState) {
      return;
    }

    this.program.update((value) => {
      let modules = [...value.modules];
      if (selectedModel.requiredModules?.length) {
        selectedModel.requiredModules.forEach((module) => {
          if (!modules.includes(module)) {
            modules.push(module);
          }
        });
      }

      let voice = value.voice ?? '';
      if (this.aiVoices.length > 0) {
        if (!voice || !this.aiVoices.includes(voice)) {
          voice = selectedModel.defaultVoice;
        }
      } else {
        voice = '';
      }

      return { ...value, modules, voice };
    });

    if (selectedModel.requiredModules?.length) {
      this.notifications.info(
        `Selected AI model required following modules - ${selectedModel.requiredModules.join(', ')}.
          All required modules automatically enabled for current program.`,
      );
    }
  }

  toggleModule(moduleId: string, isChecked: boolean) {
    this.program.update((prog) => {
      let updatedModules = [...prog.modules];
      let moduleConfigs = { ...prog.moduleConfigs };

      if (isChecked && !updatedModules.includes(moduleId)) {
        updatedModules.push(moduleId);

        // Initialize default configs if module has them and they aren't set
        const module = this.availableModules.find((m) => m.id === moduleId);
        if (module?.programConfigs?.length) {
          module.programConfigs.forEach((cfg) => {
            const key = `${moduleId}_${cfg.key}`;
            if (moduleConfigs[key] === undefined && cfg.defaultValue !== undefined) {
              moduleConfigs[key] = cfg.defaultValue;
            }
          });
        }
      } else if (!isChecked) {
        updatedModules = updatedModules.filter((id) => id !== moduleId);
        this.expandedSettings.update((s) => {
          const next = new Set(s);
          next.delete(moduleId);
          return next;
        });
      }

      return { ...prog, modules: updatedModules, moduleConfigs };
    });
  }

  toggleSettings(moduleId: string) {
    this.expandedSettings.update((s) => {
      const next = new Set(s);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  }

  async getAIModels() {
    try {
      this.aiModels = await this.api.get<IAIModelConfig[]>('/models');
    } catch (error: any) {
      this.notifications.error(error.message);
    }
  }

  async getModules() {
    try {
      const categories = await this.api.get<IModuleCategory[]>('/categories');
      this.moduleCategories = categories.sort((a, b) => a.order - b.order);
      this.availableModules = await this.api.get<IModule[]>('/modules');
    } catch (error: any) {
      this.notifications.error(error.message);
    }
  }

  getModulesByCategory(categoryId: string): IModule[] {
    return this.availableModules.filter((m) => m.category === categoryId);
  }

  async getProgram(id: string) {
    try {
      const program = await this.api.get<IProgram>(`/programs/${id}`);
      this.program.set(program);
      this.onAIModelChange(program.aiModel, false);
    } catch (error: any) {
      this.notifications.error(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(form: NgForm) {
    if (form.invalid) {
      return;
    }

    try {
      if (this.program().id) {
        await this.api.put<IProgram, IProgram>(`/programs/${this.program().id}`, this.program());
        this.notifications.success('Program updated successfully');
      } else {
        await this.api.post<IProgram, IProgram>('/programs', this.program());
        this.notifications.success('Program added successfully');
      }

      this.router.navigate(['/menu']);
    } catch (error: any) {
      this.notifications.error('Failed to save program');
    }
  }
}
