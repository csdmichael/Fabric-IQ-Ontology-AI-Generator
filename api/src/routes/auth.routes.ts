import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';
import { EntraLoginBody, OtpRequestBody, OtpVerifyBody } from '../types/auth.types';

const controller = new AuthController();
const authRouter = Router();

authRouter.post<unknown, unknown, { email?: string }>('/method', (request, response, next) => {
  void controller.resolveMethod(request, response).catch(next);
});
authRouter.post<unknown, unknown, OtpRequestBody>('/otp/request', (request, response, next) => {
  void controller.requestOtp(request, response).catch(next);
});
authRouter.post<unknown, unknown, OtpVerifyBody>('/otp/verify', (request, response, next) => {
  void controller.verifyOtp(request, response).catch(next);
});
authRouter.post<unknown, unknown, EntraLoginBody>('/entra/login', (request, response, next) => {
  void controller.loginWithEntra(request, response).catch(next);
});
authRouter.post('/guest', (request, response, next) => {
  void controller.loginAsGuest(request, response).catch(next);
});
authRouter.get('/me', requireAuth, (request, response, next) => {
  void controller.me(request, response).catch(next);
});
authRouter.get(
  '/audit',
  requireAuth,
  requirePermission('users:read'),
  (request, response, next) => {
    void controller.audit(request, response).catch(next);
  }
);

export default authRouter;
