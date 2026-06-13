import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';

export type AgentKey = 'ontology-generator' | 'ontology-data-binder';

export interface AgentChatRequest {
  threadId?: string;
  message: string;
  context?: unknown;
}

export interface AgentChatResponse {
  threadId: string;
  runId?: string;
  reply: string;
  raw?: unknown;
}

@Injectable({ providedIn: 'root' })
export class AgentChatService {
  private readonly http = inject(HttpClient);

  chat(agent: AgentKey, payload: AgentChatRequest) {
    return this.http.post<AgentChatResponse>(
      `${environment.apiUrl}/api/agents/${agent}/chat`,
      payload
    );
  }
}
