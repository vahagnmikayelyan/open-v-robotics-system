import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export enum PromptButton {
  Yes = 'YES',
  No = 'NO',
  Cancel = 'CANCEL',
  Delete = 'DELETE',
  Ok = 'OK',
}

export type PromptType = 'delete' | 'warning' | 'info' | 'question';

export interface PromptConfig {
  type: PromptType;
  title: string;
  message: string;
  buttons: PromptButton[];
}

@Injectable({
  providedIn: 'root',
})
export class PromptService {
  currentPrompt = signal<PromptConfig | null>(null);

  private responseSubject: Subject<PromptButton> | null = null;

  open(type: PromptType, title: string, message: string): Observable<PromptButton> {
    if (this.responseSubject) {
      this.responseSubject.complete();
    }

    this.responseSubject = new Subject<PromptButton>();

    let buttons: PromptButton[] = [];
    switch (type) {
      case 'delete':
        buttons = [PromptButton.Cancel, PromptButton.Delete];
        break;
      case 'question':
        buttons = [PromptButton.No, PromptButton.Yes];
        break;
      case 'warning':
        buttons = [PromptButton.Cancel, PromptButton.Ok];
        break;
      case 'info':
        buttons = [PromptButton.Ok];
        break;
    }

    this.currentPrompt.set({ type, title, message, buttons });

    return this.responseSubject.asObservable();
  }

  close(button: PromptButton) {
    if (this.responseSubject) {
      this.responseSubject.next(button);
      this.responseSubject.complete();
      this.responseSubject = null;
    }
    this.currentPrompt.set(null);
  }
}
