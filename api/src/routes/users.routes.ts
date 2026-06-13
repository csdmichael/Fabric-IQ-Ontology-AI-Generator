import { Request, Router } from 'express';

import { UserController } from '../controllers/user.controller';
import { requireAuth, requirePermission } from '../middleware/auth.middleware';
import type { UserUpsertInput } from '../types/user.types';

const controller = new UserController();
const usersRouter = Router();

type IdParams = { id: string };

usersRouter.use(requireAuth);

usersRouter.get('/', requirePermission('users:read'), (request, response) => controller.list(request, response));
usersRouter.post('/', requirePermission('users:manage'), (request, response) => controller.create(request, response));
usersRouter.put('/:id', requirePermission('users:manage'), (request, response) => controller.update(request as Request<IdParams, unknown, UserUpsertInput>, response));
usersRouter.delete('/:id', requirePermission('users:manage'), (request, response) => controller.remove(request as Request<IdParams>, response));

export default usersRouter;
