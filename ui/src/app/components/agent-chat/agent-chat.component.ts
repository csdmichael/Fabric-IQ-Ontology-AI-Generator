import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonTextarea
} from '@ionic/angular/standalone';

import { AgentChatService, AgentKey } from '../../services/agent-chat.service';

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-agent-chat',
  standalone: true,
  templateUrl: './agent-chat.component.html',
  imports: [
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonNote
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentChatComponent {
  private readonly service = inject(AgentChatService);

  @Input({ required: true }) agentKey!: AgentKey;
  @Input() title = 'Agent';
  @Input() subtitle = '';
  @Input() context?: unknown;

  readonly transcript = signal<ChatTurn[]>([]);
  readonly busy = signal(false);
  readonly draft = signal('');
  readonly error = signal<string | null>(null);
  private threadId: string | undefined;

  async send(): Promise<void> {
    const message = this.draft().trim();
    if (!message || this.busy()) {
      return;
    }
    this.draft.set('');
    this.transcript.update((items) => [...items, { role: 'user', text: message }]);
    this.busy.set(true);
    this.error.set(null);
    try {
      const response = await new Promise<{ threadId: string; reply: string }>((resolve, reject) => {
        this.service
          .chat(this.agentKey, { threadId: this.threadId, message, context: this.context })
          .subscribe({ next: resolve, error: reject });
      });
      this.threadId = response.threadId;
      this.transcript.update((items) => [...items, { role: 'assistant', text: response.reply }]);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Agent call failed.');
    } finally {
      this.busy.set(false);
    }
  }

  reset(): void {
    this.transcript.set([]);
    this.threadId = undefined;
    this.error.set(null);
  }
}
