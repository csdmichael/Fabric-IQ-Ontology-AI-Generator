import { Request, Response, Router } from 'express';

import { FoundryAgentController } from '../controllers/foundry-agent.controller';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';
import { FoundryAgentKey } from '../services/foundry-agent.service';

const controller = new FoundryAgentController();
const agentsRouter = Router();

agentsRouter.use(requireAuth);

const handle = (agentKey: FoundryAgentKey) => (request: Request, response: Response) => {
  request.params = { ...request.params, agentKey };
  return controller.chat(request as Request<{ agentKey: string }>, response);
};

agentsRouter.post(
  '/ontology-generator/chat',
  requirePermission('agent:ontology-generator'),
  handle('ontology-generator')
);

agentsRouter.post(
  '/ontology-data-binder/chat',
  requirePermission('agent:ontology-data-binder'),
  handle('ontology-data-binder')
);

export default agentsRouter;
