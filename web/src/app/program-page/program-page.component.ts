import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { AiModel, Program } from '../../models/models';
import { ApiService } from '../../services/api.service';
import { UiLoaderComponent } from '../../components/ui-loader/ui-loader.component';
import { NotificationService } from '../../services/notification.service';

const MODULE_DICTIONARY: Record<string, { name: string; desc: string }> = {
  distanceSensor: { name: 'Distance Sensor', desc: 'Detects obstacles and measures distance for collision avoidance.' },
  drive: { name: 'Drive Motors', desc: 'Allows the AI to control the chassis and navigate.' },
  fan: { name: 'Active Cooling', desc: 'Controls the fan for thermal management.' },
  inertialSensor: { name: 'Inertial Sensor', desc: 'Provides tilt, acceleration, and rotation telemetry.' },
  light: { name: 'Lights', desc: 'Controls external LEDs and visual indicators.' },
  lightSensor: { name: 'Light Sensor', desc: 'Measures environmental illumination levels.' },
  power: { name: 'Power Monitor', desc: 'Monitors battery level and power consumption.' },
  headServo: { name: 'Head Servo', desc: 'Allows the AI to move the head for tracking.' },
  thermalSensor: { name: 'Thermal Sensor', desc: 'Monitors system and environmental temperatures.' },
  camera: { name: 'Camera', desc: 'Enables using Camera.' },
  speaker: { name: 'Speakers', desc: 'Allows the AI to speak using stereo speakers.' },
  microphone: { name: 'Microphone', desc: 'Enables microphones.' },
};

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

  program = signal<Program>({
    id: '',
    name: '',
    systemInstruction: '',
    aiModel: '',
    modules: [],
  });
  dict = MODULE_DICTIONARY;

  aiModels: AiModel[] = [];
  availableModules: string[] = [];

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
      this.aiModels = await this.api.get<AiModel[]>('/models');
    } catch (error: any) {
      this.notifications.error(error.message);
    }
  }

  async getModules() {
    try {
      this.availableModules = await this.api.get<string[]>('/modules');
    } catch (error: any) {
      this.notifications.error(error.message);
    }
  }

  async getProgram(id: string) {
    try {
      const program = await this.api.get<Program>(`/programs/${id}`);
      this.program.set(program);
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
        await this.api.put<Program, Program>(`/programs/${this.program().id}`, this.program());
        this.notifications.success('Program updated successfully');
      } else {
        await this.api.post<Program, Program>('/programs', this.program());
        this.notifications.success('Program added successfully');
      }

      this.router.navigate(['/menu']);
    } catch (error: any) {
      this.notifications.error('Failed to save program');
    }
  }
}
