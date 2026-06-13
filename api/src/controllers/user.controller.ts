import { Request, Response } from 'express';

import { userService } from '../services/user.service';
import { UserUpsertInput } from '../types/user.types';

export class UserController {
  async list(_request: Request, response: Response): Promise<void> {
    const users = await userService.list();
    response.status(200).json(users);
  }

  async create(request: Request<unknown, unknown, UserUpsertInput>, response: Response): Promise<void> {
    if (!request.body?.email || !request.body?.role || !request.body?.authMethod) {
      response.status(400).json({ message: 'email, role and authMethod are required.' });
      return;
    }
    const user = await userService.upsert(request.body);
    response.status(201).json(user);
  }

  async update(request: Request<{ id: string }, unknown, UserUpsertInput>, response: Response): Promise<void> {
    if (!request.body?.email || !request.body?.role || !request.body?.authMethod) {
      response.status(400).json({ message: 'email, role and authMethod are required.' });
      return;
    }
    const user = await userService.upsert({ ...request.body, id: request.params.id });
    response.status(200).json(user);
  }

  async remove(request: Request<{ id: string }>, response: Response): Promise<void> {
    if (request.user && request.user.id === request.params.id) {
      response.status(400).json({ message: 'You cannot delete your own account.' });
      return;
    }
    const ok = await userService.remove(request.params.id);
    response.status(ok ? 204 : 404).send(ok ? undefined : { message: 'User not found.' });
  }
}
