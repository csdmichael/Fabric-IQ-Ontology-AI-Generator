import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';

const controller = new AuthController();
const authRouter = Router();
const asyncRoute = <TRequest, TResponse>(
  handler: (request: TRequest, response: TResponse) => Promise<void>
) => (request: TRequest, response: TResponse, next: (error?: unknown) => void): void => {
  void handler(request, response).catch(next);
};

authRouter.post('/method', asyncRoute((request, response) => controller.resolveMethod(request, response)));
authRouter.post('/otp/request', asyncRoute((request, response) => controller.requestOtp(request, response)));
authRouter.post('/otp/verify', asyncRoute((request, response) => controller.verifyOtp(request, response)));
authRouter.post('/entra/login', asyncRoute((request, response) => controller.loginWithEntra(request, response)));
authRouter.post('/guest', asyncRoute((request, response) => controller.loginAsGuest(request, response)));
authRouter.get('/me', requireAuth, asyncRoute((request, response) => controller.me(request, response)));
authRouter.get(
  '/audit',
  requireAuth,
  requirePermission('users:read'),
  asyncRoute((request, response) => controller.audit(request, response))
);

export default authRouter;
