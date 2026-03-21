import { Component, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { PromptService, PromptButton } from '../../services/prompt.service';
import { LucideAngularModule, AlertTriangle, Info, HelpCircle, MessageCircleWarningIcon } from 'lucide-angular';

@Component({
  selector: 'prompt-dialog',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, LucideAngularModule],
  templateUrl: './prompt-dialog.component.html',
  styleUrl: './prompt-dialog.component.less',
})
export class PromptDialogComponent {
  private promptService = inject(PromptService);

  readonly LucideIcons = { AlertTriangle, Info, HelpCircle, MessageCircleWarningIcon };

  get config() {
    return this.promptService.currentPrompt();
  }

  onAction(btn: PromptButton) {
    this.promptService.close(btn);
  }
}
