import { NextFunction, Request, Response } from 'express';

import { Permission, hasPermission, roleAtLeast } from '../config/roles';
import { AuthenticatedUser, UserRole } from '../types/auth.types';
import { tokenService } from '../services/token.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const requireAuth = (request: Request, response: Response, next: NextFunction): void => {
  const header = request.header('authorization') ?? request.header('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }

  const token = header.slice(7).trim();
  try {
    const claims = tokenService.verify(token);
    request.user = {
      id: claims.sub,
      email: claims.email,
      displayName: claims.name,
      role: claims.role,
      authMethod: claims.method
    };
    next();
  } catch (error) {
    response.status(401).json({ message: 'Invalid or expired session token.' });
  }
};

export const requireRole = (...roles: UserRole[]) =>
  (request: Request, response: Response, next: NextFunction): void => {
    if (!request.user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }
    if (!roles.includes(request.user.role)) {
      response.status(403).json({ message: 'Forbidden: insufficient role.' });
      return;
    }
    next();
  };

export const requireMinimumRole = (minimum: UserRole) =>
  (request: Request, response: Response, next: NextFunction): void => {
    if (!request.user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }
    if (!roleAtLeast(request.user.role, minimum)) {
      response.status(403).json({ message: 'Forbidden: insufficient role.' });
      return;
    }
    next();
  };

export const requirePermission = (permission: Permission) =>
  (request: Request, response: Response, next: NextFunction): void => {
    if (!request.user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }
    if (!hasPermission(request.user.role, permission)) {
      response.status(403).json({ message: `Forbidden: missing permission ${permission}.` });
      return;
    }
    next();
  };
