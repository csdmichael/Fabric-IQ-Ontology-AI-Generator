import express, { Express, NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

import { environment } from './config/environment';
import { openApiSpec } from './config/openapi';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import apiRouter from './routes';

export const createApp = (): Express => {
  const app = express();

  app.use(corsMiddleware);
  app.use(express.json());
  app.use('/api', apiRouter);

  // OpenAPI / Swagger
  app.get('/api/openapi.json', (_request: Request, response: Response) => {
    response.status(200).json(openApiSpec);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec as unknown as object, {
      explorer: true,
      customSiteTitle: 'Fabric IQ API — Swagger',
      swaggerOptions: { persistAuthorization: true }
    })
  );

  app.get('/', (_request: Request, response: Response) => {
    response.status(200).json({
      name: 'Fabric IQ Ontology AI Generator API',
      status: 'running',
      docs: '/api/docs',
      openapi: '/api/openapi.json'
    });
  });
  app.use((_request: Request, response: Response) => {
    response.status(404).json({ message: 'Route not found.' });
  });
  app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
    errorMiddleware(error as never, request, response, next);
  });

  return app;
};

export const app = createApp();

if (require.main === module) {
  app.listen(environment.port, () => {
    console.log(`Fabric IQ API listening on port ${environment.port}`);
  });
}
