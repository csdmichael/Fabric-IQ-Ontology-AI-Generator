import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';

import { environment } from '../config/environment';

export interface EntraVerifiedIdentity {
  email: string;
  displayName: string;
  oid: string;
  tenantId: string;
}

let cachedJwks: JwksClient | undefined;

const getJwks = (): JwksClient => {
  if (!cachedJwks) {
    cachedJwks = jwksClient({
      jwksUri: environment.entraJwksUri,
      cache: true,
      rateLimit: true
    });
  }
  return cachedJwks;
};

const getKey = (header: JwtHeader, callback: SigningKeyCallback): void => {
  if (!header.kid) {
    callback(new Error('Missing key id in Entra ID token header.'));
    return;
  }
  getJwks().getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err ?? new Error('Signing key not found.'));
      return;
    }
    callback(null, key.getPublicKey());
  });
};

/**
 * Verifies an Entra ID `id_token` minted by MSAL on the UI, asserting:
 * - signature matches a key from the tenant JWKS,
 * - issuer matches the configured tenant,
 * - audience matches the configured SPA client id (when provided),
 * - the user email belongs to the allowed corporate domain.
 */
export class EntraService {
  async verifyIdToken(idToken: string): Promise<EntraVerifiedIdentity> {
    if (!idToken) {
      throw new Error('Entra ID token is required.');
    }

    const verifyOptions: jwt.VerifyOptions = {
      algorithms: ['RS256'],
      issuer: [environment.entraIssuer, `https://sts.windows.net/${environment.entraTenantId}/`]
    };
    if (environment.entraClientId) {
      verifyOptions.audience = environment.entraClientId;
    }

    const claims = await new Promise<jwt.JwtPayload>((resolve, reject) => {
      jwt.verify(idToken, getKey, verifyOptions, (err, decoded) => {
        if (err || !decoded || typeof decoded === 'string') {
          reject(err ?? new Error('Invalid Entra ID token.'));
          return;
        }
        resolve(decoded);
      });
    });

    const email = (claims['preferred_username'] as string | undefined)
      ?? (claims['upn'] as string | undefined)
      ?? (claims['email'] as string | undefined);
    if (!email) {
      throw new Error('Entra ID token did not include an email/upn claim.');
    }

    if (!email.toLowerCase().endsWith(environment.authAllowedEntraDomain)) {
      throw new Error(`Entra ID accounts must use the ${environment.authAllowedEntraDomain} domain.`);
    }

    return {
      email,
      displayName: (claims['name'] as string | undefined) ?? email,
      oid: (claims['oid'] as string | undefined) ?? (claims['sub'] as string | undefined) ?? email,
      tenantId: (claims['tid'] as string | undefined) ?? environment.entraTenantId
    };
  }
}

export const entraService = new EntraService();
