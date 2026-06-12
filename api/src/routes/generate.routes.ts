import { Router } from 'express';

import { GenerateController } from '../controllers/generate.controller';

const controller = new GenerateController();
const generateRouter = Router();

generateRouter.post('/', (request, response) => controller.createDraft(request, response));

export default generateRouter;
