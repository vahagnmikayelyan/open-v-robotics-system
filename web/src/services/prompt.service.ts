import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export enum PromptButton {
  Yes = 'YES',
  No = 'NO',
  Cancel = 'CANCEL',
  Delete = 'DELETE',
  Ok = 'OK',
  Restart = 'RESTART',
  PowerOff = 'POWER_OFF',
}

export type PromptType = 'error' | 'warning' | 'info' | 'question';

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

  open(dialogType: PromptType, title: string, message: string, buttons: PromptButton[]): Observable<PromptButton> {
    if (this.responseSubject) {
      this.responseSubject.complete();
    }

    this.responseSubject = new Subject<PromptButton>();

    this.currentPrompt.set({ type: dialogType, title, message, buttons });

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
