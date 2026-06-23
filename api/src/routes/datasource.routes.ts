import { Router } from 'express';

import { DatasourceController } from '../controllers/datasource.controller';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';

const controller = new DatasourceController();
const datasourceRouter = Router();

datasourceRouter.use(requireAuth);

datasourceRouter.get('/', requirePermission('datasource:read'), (request, response) => controller.list(request, response));
datasourceRouter.post('/', requirePermission('datasource:configure'), (request, response) => controller.create(request, response));
datasourceRouter.get('/config', requirePermission('datasource:read'), (request, response) => controller.getConfig(request, response));
datasourceRouter.put('/config', requirePermission('datasource:configure'), (request, response) => controller.updateConfig(request, response));

export default datasourceRouter;
