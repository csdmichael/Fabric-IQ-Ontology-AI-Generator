import { Router } from 'express';

import datasourceRouter from './datasource.routes';
import generateRouter from './generate.routes';
import healthRouter from './health.routes';
import ontologyRouter from './ontology.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/ontologies', ontologyRouter);
apiRouter.use('/datasources', datasourceRouter);
apiRouter.use('/generate', generateRouter);

export default apiRouter;
