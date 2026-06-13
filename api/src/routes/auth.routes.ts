import { Request, RequestHandler, Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';
import { createRateLimit } from '../middleware/rate-limit.middleware';
import { EntraLoginBody, OtpRequestBody, OtpVerifyBody } from '../types/auth.types';

const controller = new AuthController();
const authRouter = Router();
const authRateLimit = createRateLimit({ windowMs: 60_000, maxRequests: 10 });
const authReadRateLimit = createRateLimit({ windowMs: 60_000, maxRequests: 30 });
const withRateLimit = (limiter: RequestHandler, handler: RequestHandler): RequestHandler => {
  return (request, response, next) => {
    limiter(request, response, (error?: unknown) => {
      if (error) {
        next(error);
        return;
      }
      handler(request, response, next);
    });
  };
};

authRouter.post(
  '/method',
  withRateLimit(
    authRateLimit,
    (request, response, next) => {
      void controller.resolveMethod(
        request as Request<unknown, unknown, { email?: string }>,
        response
      ).catch(next);
    }
  )
);
authRouter.post(
  '/otp/request',
  withRateLimit(
    authRateLimit,
    (request, response, next) => {
      void controller.requestOtp(request as Request<unknown, unknown, OtpRequestBody>, response).catch(next);
    }
  )
);
authRouter.post(
  '/otp/verify',
  withRateLimit(
    authRateLimit,
    (request, response, next) => {
      void controller.verifyOtp(request as Request<unknown, unknown, OtpVerifyBody>, response).catch(next);
    }
  )
);
authRouter.post(
  '/entra/login',
  withRateLimit(
    authRateLimit,
    (request, response, next) => {
      void controller.loginWithEntra(request as Request<unknown, unknown, EntraLoginBody>, response).catch(next);
    }
  )
);
authRouter.post('/guest', withRateLimit(authRateLimit, (request, response, next) => {
  void controller.loginAsGuest(request, response).catch(next);
}));
authRouter.get('/me', withRateLimit(authReadRateLimit, requireAuth), (request, response, next) => {
  void controller.me(request, response).catch(next);
});
authRouter.get(
  '/audit',
  withRateLimit(authReadRateLimit, requireAuth),
  requirePermission('users:read'),
  (request, response, next) => {
    void controller.audit(request, response).catch(next);
  }
);

export default authRouter;
