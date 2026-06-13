import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const controller = new AuthController();
const authRouter = Router();

authRouter.post('/method', (request, response) => controller.resolveMethod(request, response));
authRouter.post('/otp/request', (request, response) => controller.requestOtp(request, response));
authRouter.post('/otp/verify', (request, response) => controller.verifyOtp(request, response));
authRouter.post('/entra/login', (request, response) => controller.loginWithEntra(request, response));
authRouter.post('/guest', (request, response) => controller.loginAsGuest(request, response));
authRouter.get('/me', requireAuth, (request, response) => controller.me(request, response));

export default authRouter;
