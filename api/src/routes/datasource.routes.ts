import { Router } from 'express';

import { DatasourceController } from '../controllers/datasource.controller';

const controller = new DatasourceController();
const datasourceRouter = Router();

datasourceRouter.get('/', (request, response) => controller.list(request, response));
datasourceRouter.get('/config', (request, response) => controller.getConfig(request, response));
datasourceRouter.put('/config', (request, response) => controller.updateConfig(request, response));

export default datasourceRouter;
