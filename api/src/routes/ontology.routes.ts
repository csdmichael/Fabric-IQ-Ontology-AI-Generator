import { Router } from 'express';

import { OntologyController } from '../controllers/ontology.controller';

const controller = new OntologyController();
const ontologyRouter = Router();

ontologyRouter.get('/', (request, response) => controller.list(request, response));
ontologyRouter.get('/:id', (request, response) => controller.getById(request, response));
ontologyRouter.post('/', (request, response) => controller.create(request, response));
ontologyRouter.put('/:id', (request, response) => controller.update(request, response));
ontologyRouter.delete('/:id', (request, response) => controller.remove(request, response));

export default ontologyRouter;
