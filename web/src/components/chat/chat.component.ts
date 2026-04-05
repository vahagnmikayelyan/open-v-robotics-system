import {
  Component,
  input,
  output,
  signal,
  effect,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Send, Trash2 } from 'lucide-angular';
import { IChatMessage } from '../../models/models';

@Component({
  selector: 'chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  readonly LucideIcons = { Send, Trash2 };

  messages = input.required<IChatMessage[]>();
  sendMessage = output<string>();
  clearChat = output<void>();
  command = output<string>();
  inputText = signal('');
  scrollContainer = viewChild.required<ElementRef>('scrollContainer');

  constructor() {
    effect(() => {
      setTimeout(() => {
        const el = this.scrollContainer().nativeElement;
        el.scrollTop = el.scrollHeight;
      }, 50);
    });
  }

  adjustHeight(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  onClear() {
    this.clearChat.emit();
  }

  onSend(el: HTMLTextAreaElement) {
    const text = this.inputText().trim();
    if (!text) return;

    this.sendMessage.emit(text);
    this.inputText.set('');

    el.style.height = 'auto';
    el.focus();
  }

  onKeydown(event: KeyboardEvent, el: HTMLTextAreaElement) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend(el);
    }
  }
}
