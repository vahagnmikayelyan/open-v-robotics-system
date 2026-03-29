import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { IAIModelConfig, IModule, IProgram } from '../../models/models';
import { ApiService } from '../../services/api.service';
import { UiLoaderComponent } from '../../components/ui-loader/ui-loader.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'program-page',
  standalone: true,
  imports: [FormsModule, RouterLink, UiLoaderComponent, NgIf, NgFor],
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
    modules: [],
  });

  aiModels: IAIModelConfig[] = [];
  availableModules: IModule[] = [];
  requiredModules: Set<string> = new Set();

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

    if (selectedModel) {
      this.requiredModules = new Set(selectedModel.requiredModules || []);

      if (selectedModel.requiredModules?.length && updateState) {
        this.notifications.info(
          `Selected AI model required following modules - ${selectedModel.requiredModules.join(', ')}.
          All required modules automatically enabled for current program.`,
        );

        const selectedModules = this.program().modules;

        selectedModel.requiredModules.forEach((module) => {
          if (!selectedModules.includes(module)) {
            selectedModules.push(module);
          }
        });

        this.program.update((value) => ({ ...value, modules: selectedModules }));
      }
    }
  }

  toggleModule(moduleId: string, isChecked: boolean) {
    this.program.update((prog) => {
      let updatedModules = [...prog.modules];

      if (isChecked && !updatedModules.includes(moduleId)) {
        updatedModules.push(moduleId);
      } else if (!isChecked) {
        updatedModules = updatedModules.filter((id) => id !== moduleId);
      }

      return { ...prog, modules: updatedModules };
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
      this.availableModules = await this.api.get<IModule[]>('/modules');
    } catch (error: any) {
      this.notifications.error(error.message);
    }
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
