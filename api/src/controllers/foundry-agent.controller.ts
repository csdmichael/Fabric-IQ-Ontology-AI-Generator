import { Request, Response } from 'express';

import { AgentChatRequest, FoundryAgentKey, foundryAgentService } from '../services/foundry-agent.service';

const VALID_AGENTS: FoundryAgentKey[] = ['ontology-generator', 'ontology-data-binder'];

export class FoundryAgentController {
  async chat(
    request: Request<{ agentKey: string }, unknown, Omit<AgentChatRequest, 'agentKey'>>,
    response: Response
  ): Promise<void> {
    const { agentKey } = request.params;
    if (!VALID_AGENTS.includes(agentKey as FoundryAgentKey)) {
      response.status(400).json({ message: `Unknown agent ${agentKey}. Expected one of ${VALID_AGENTS.join(', ')}.` });
      return;
    }

    const { message, threadId, context } = request.body ?? {};
    if (!message?.trim()) {
      response.status(400).json({ message: 'message is required.' });
      return;
    }

    const result = await foundryAgentService.chat({
      agentKey: agentKey as FoundryAgentKey,
      message,
      threadId,
      context
    });

    response.status(200).json(result);
  }
}
