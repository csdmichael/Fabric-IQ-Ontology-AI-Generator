import { DefaultAzureCredential, TokenCredential } from '@azure/identity';

import { environment } from '../config/environment';

export type FoundryAgentKey = 'ontology-generator' | 'ontology-data-binder';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentChatRequest {
  agentKey: FoundryAgentKey;
  threadId?: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface AgentChatResponse {
  agentKey: FoundryAgentKey;
  agentId: string;
  threadId: string;
  reply: string;
  delivered: boolean;
  citations?: Array<{ title?: string; uri?: string }>;
}

const SCOPE = 'https://ai.azure.com/.default';

/**
 * Thin wrapper around the Microsoft Foundry "agents" REST surface
 * (https://learn.microsoft.com/azure/ai-foundry/). When the project endpoint
 * or agent ids are not configured (e.g. local dev without a private endpoint),
 * the service falls back to a deterministic stub so the UI flow remains testable.
 */
export class FoundryAgentService {
  private credential: TokenCredential | undefined;

  private getCredential(): TokenCredential | undefined {
    if (!environment.foundryProjectEndpoint) {
      return undefined;
    }
    if (!this.credential) {
      this.credential = new DefaultAzureCredential();
    }
    return this.credential;
  }

  resolveAgentId(key: FoundryAgentKey): string {
    return key === 'ontology-generator'
      ? environment.foundryOntologyGeneratorAgentId
      : environment.foundryOntologyDataBinderAgentId;
  }

  async chat(payload: AgentChatRequest): Promise<AgentChatResponse> {
    const agentId = this.resolveAgentId(payload.agentKey);
    const credential = this.getCredential();

    if (!credential || !agentId) {
      // Offline / dev stub: echo plus deterministic suggestion.
      return {
        agentKey: payload.agentKey,
        agentId: agentId || 'stub',
        threadId: payload.threadId ?? `local-${Date.now()}`,
        reply: this.stubReply(payload),
        delivered: false
      };
    }

    const token = await credential.getToken(SCOPE);
    if (!token) {
      throw new Error('Failed to acquire Foundry access token.');
    }

    const baseUrl = environment.foundryProjectEndpoint.replace(/\/+$/, '');
    const apiVersion = environment.foundryApiVersion;

    // 1) Ensure a thread.
    let threadId = payload.threadId;
    if (!threadId) {
      const threadResponse = await fetch(`${baseUrl}/threads?api-version=${apiVersion}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      if (!threadResponse.ok) {
        throw new Error(`Foundry thread creation failed: ${threadResponse.status} ${threadResponse.statusText}`);
      }
      const thread = (await threadResponse.json()) as { id: string };
      threadId = thread.id;
    }

    // 2) Post a user message.
    const messageResponse = await fetch(`${baseUrl}/threads/${threadId}/messages?api-version=${apiVersion}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'user',
        content: payload.message,
        metadata: payload.context
      })
    });
    if (!messageResponse.ok) {
      throw new Error(`Foundry message post failed: ${messageResponse.status} ${messageResponse.statusText}`);
    }

    // 3) Run the agent.
    const runResponse = await fetch(`${baseUrl}/threads/${threadId}/runs?api-version=${apiVersion}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assistant_id: agentId })
    });
    if (!runResponse.ok) {
      throw new Error(`Foundry run failed: ${runResponse.status} ${runResponse.statusText}`);
    }
    const run = (await runResponse.json()) as { id: string; status: string };

    // 4) Poll for completion (short backoff loop).
    let finished = run;
    const deadline = Date.now() + 45_000;
    while (finished.status !== 'completed' && finished.status !== 'failed' && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      const pollResponse = await fetch(`${baseUrl}/threads/${threadId}/runs/${run.id}?api-version=${apiVersion}`, {
        headers: { Authorization: `Bearer ${token.token}` }
      });
      if (!pollResponse.ok) {
        break;
      }
      finished = (await pollResponse.json()) as { id: string; status: string };
    }

    // 5) Fetch latest assistant message.
    const messagesResponse = await fetch(`${baseUrl}/threads/${threadId}/messages?api-version=${apiVersion}&order=desc&limit=10`, {
      headers: { Authorization: `Bearer ${token.token}` }
    });
    const messages = (await messagesResponse.json()) as { data?: Array<{ role: string; content?: Array<{ text?: { value?: string } }> }> };
    const latestAssistant = messages.data?.find((msg) => msg.role === 'assistant');
    const reply = latestAssistant?.content?.map((part) => part.text?.value ?? '').join('\n').trim() ?? '';

    return {
      agentKey: payload.agentKey,
      agentId,
      threadId,
      reply,
      delivered: finished.status === 'completed'
    };
  }

  private stubReply(payload: AgentChatRequest): string {
    if (payload.agentKey === 'ontology-generator') {
      return [
        'Draft ontology suggestion (stub mode — Foundry agent not yet bound):',
        `- Business intent: ${payload.message.slice(0, 120)}...`,
        '- Suggested core entities: Customer, Product, Order, OrderLine',
        '- Suggested relationships: Customer places Order, Order contains OrderLine, OrderLine references Product'
      ].join('\n');
    }
    return [
      'Data binding suggestion (stub mode — Foundry agent not yet bound):',
      `- Source guidance based on: ${payload.message.slice(0, 120)}...`,
      '- lakehouse.dim_customer → Customer',
      '- lakehouse.fact_orders → Order, OrderLine',
      '- lakehouse.dim_product → Product'
    ].join('\n');
  }
}

export const foundryAgentService = new FoundryAgentService();
