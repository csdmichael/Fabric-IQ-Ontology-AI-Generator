import jwt from 'jsonwebtoken';

import { environment } from '../config/environment';
import { AuthenticatedUser, JwtClaims, SessionToken } from '../types/auth.types';
import { UserRecord } from '../types/user.types';

export class TokenService {
  issue(user: UserRecord): SessionToken {
    const claims: JwtClaims = {
      sub: user.id,
      email: user.email,
      role: user.role,
      method: user.authMethod,
      name: user.displayName
    };

    const token = jwt.sign(claims, environment.jwtSecret, {
      issuer: environment.jwtIssuer,
      audience: environment.jwtAudience,
      expiresIn: environment.jwtTtlSeconds
    });

    const expiresAt = new Date(Date.now() + environment.jwtTtlSeconds * 1000).toISOString();

    const authenticated: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      authMethod: user.authMethod
    };

    return { token, expiresAt, user: authenticated };
  }

  verify(token: string): JwtClaims {
    const decoded = jwt.verify(token, environment.jwtSecret, {
      issuer: environment.jwtIssuer,
      audience: environment.jwtAudience
    });
    if (typeof decoded === 'string') {
      throw new Error('Invalid session token.');
    }
    return decoded as JwtClaims;
  }
}

export const tokenService = new TokenService();
