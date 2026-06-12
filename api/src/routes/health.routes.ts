import { Router } from 'express';

import { environment } from '../config/environment';

const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'fabric-iq-api',
    environment: environment.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

export default healthRouter;
