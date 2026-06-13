import { NextFunction, Request, Response, Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';
import { createRateLimit } from '../middleware/rate-limit.middleware';
import { EntraLoginBody, OtpRequestBody, OtpVerifyBody } from '../types/auth.types';

const controller = new AuthController();
const authRouter = Router();
const authRateLimit = createRateLimit({ windowMs: 60_000, maxRequests: 10 });
const authReadRateLimit = createRateLimit({ windowMs: 60_000, maxRequests: 30 });

authRouter.post(
  '/method',
  authRateLimit,
  (
    request: Request<Record<string, string>, unknown, { email?: string }>,
    response: Response,
    next: NextFunction
  ) => {
  void controller.resolveMethod(request, response).catch(next);
  }
);
authRouter.post(
  '/otp/request',
  authRateLimit,
  (
    request: Request<Record<string, string>, unknown, OtpRequestBody>,
    response: Response,
    next: NextFunction
  ) => {
  void controller.requestOtp(request, response).catch(next);
  }
);
authRouter.post(
  '/otp/verify',
  authRateLimit,
  (
    request: Request<Record<string, string>, unknown, OtpVerifyBody>,
    response: Response,
    next: NextFunction
  ) => {
  void controller.verifyOtp(request, response).catch(next);
  }
);
authRouter.post(
  '/entra/login',
  authRateLimit,
  (
    request: Request<Record<string, string>, unknown, EntraLoginBody>,
    response: Response,
    next: NextFunction
  ) => {
  void controller.loginWithEntra(request, response).catch(next);
  }
);
authRouter.post('/guest', authRateLimit, (request, response, next) => {
  void controller.loginAsGuest(request, response).catch(next);
});
authRouter.get('/me', authReadRateLimit, requireAuth, (request, response, next) => {
  void controller.me(request, response).catch(next);
});
authRouter.get(
  '/audit',
  authReadRateLimit,
  requireAuth,
  requirePermission('users:read'),
  (request, response, next) => {
    void controller.audit(request, response).catch(next);
  }
);

export default authRouter;
