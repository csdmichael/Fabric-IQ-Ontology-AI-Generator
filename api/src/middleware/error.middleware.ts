import { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Unexpected server error.';

  response.status(statusCode).json({
    message,
    statusCode
  });
};
