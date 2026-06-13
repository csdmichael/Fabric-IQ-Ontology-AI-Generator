import { Router } from 'express';

import { GenerateController } from '../controllers/generate.controller';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';

const controller = new GenerateController();
const generateRouter = Router();

generateRouter.use(requireAuth);

generateRouter.post(
  '/',
  requirePermission('ontology:create'),
  (request, response) => controller.createDraft(request, response)
);

export default generateRouter;
