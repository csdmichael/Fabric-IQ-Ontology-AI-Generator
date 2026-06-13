import { Request, Router } from 'express';

import { OntologyController } from '../controllers/ontology.controller';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';
import type { OntologyInput } from '../types/ontology.types';

const controller = new OntologyController();
const ontologyRouter = Router();

type IdParams = { id: string };

ontologyRouter.use(requireAuth);

ontologyRouter.get('/', requirePermission('ontology:read'), (request, response) => controller.list(request, response));
ontologyRouter.get('/:id', requirePermission('ontology:read'), (request, response) => controller.getById(request as Request<IdParams>, response));
ontologyRouter.post('/', requirePermission('ontology:create'), (request, response) => controller.create(request as Request<unknown, unknown, OntologyInput>, response));
ontologyRouter.put('/:id', requirePermission('ontology:edit'), (request, response) => controller.update(request as Request<IdParams, unknown, OntologyInput>, response));
ontologyRouter.delete('/:id', requirePermission('ontology:edit'), (request, response) => controller.remove(request as Request<IdParams>, response));

ontologyRouter.post(
  '/:id/submit-for-binding',
  requirePermission('ontology:submit-for-binding'),
  (request, response) => controller.submitForBinding(request as Request<IdParams, unknown, { note?: string }>, response)
);
ontologyRouter.post(
  '/:id/submit-for-deployment',
  requirePermission('ontology:submit-for-deployment'),
  (request, response) => controller.submitForDeployment(request as Request<IdParams, unknown, { note?: string }>, response)
);
ontologyRouter.post(
  '/:id/deploy',
  requirePermission('ontology:deploy-to-fabric'),
  (request, response) => controller.deployToFabric(request as Request<IdParams, unknown, { note?: string }>, response)
);

export default ontologyRouter;
