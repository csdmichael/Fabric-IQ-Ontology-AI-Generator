import { Router } from 'express';

import agentsRouter from './agents.routes';
import authRouter from './auth.routes';
import datasourceRouter from './datasource.routes';
import generateRouter from './generate.routes';
import healthRouter from './health.routes';
import ontologyRouter from './ontology.routes';
import usersRouter from './users.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/ontologies', ontologyRouter);
apiRouter.use('/datasources', datasourceRouter);
apiRouter.use('/generate', generateRouter);
apiRouter.use('/agents', agentsRouter);

export default apiRouter;
