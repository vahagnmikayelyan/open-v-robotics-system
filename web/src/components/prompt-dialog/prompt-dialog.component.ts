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

  getBtnClass(btn: PromptButton): string {
    switch (btn) {
      case PromptButton.Delete:
        return 'btn-danger';
      case PromptButton.Yes:
      case PromptButton.Ok:
        return 'btn-primary';
      case PromptButton.No:
      case PromptButton.Cancel:
        return 'btn-secondary';
      default:
        return 'btn-secondary';
    }
  }
}
