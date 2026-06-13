import { Request, Response } from 'express';

import { permissionsForRole } from '../config/roles';
import { entraService } from '../services/entra.service';
import { loginAuditService } from '../services/login-audit.service';
import { otpService } from '../services/otp.service';
import { tokenService } from '../services/token.service';
import { userService } from '../services/user.service';
import { AuthMethod, AuthenticatedUser, EntraLoginBody, OtpRequestBody, OtpVerifyBody } from '../types/auth.types';

export class AuthController {
  /** Step 1: business user supplies their email; we look up which method to use. */
  async resolveMethod(request: Request<unknown, unknown, { email?: string }>, response: Response): Promise<void> {
    const email = request.body.email?.trim().toLowerCase();
    if (!email) {
      response.status(400).json({ message: 'email is required.' });
      return;
    }
    const user = await userService.findByEmail(email);
    if (user) {
      response.status(200).json({ email: user.email, method: user.authMethod, exists: true });
      return;
    }
    // Unknown account — default to Entra ID if domain matches; otherwise reject.
    const looksCorporate = email.endsWith((await import('../config/environment')).environment.authAllowedEntraDomain);
    response.status(200).json({
      email,
      method: looksCorporate ? 'entra_id' : 'otp',
      exists: false
    });
  }

  /** Step 2 (OTP): issue a code via Azure Communication Services Email. */
  async requestOtp(request: Request<unknown, unknown, OtpRequestBody>, response: Response): Promise<void> {
    const email = request.body.email?.trim().toLowerCase();
    if (!email) {
      response.status(400).json({ message: 'email is required.' });
      return;
    }

    const user = await userService.findByEmail(email);
    if (!user || user.authMethod !== 'otp' || !user.enabled) {
      // Always respond OK to avoid email enumeration leaks.
      response.status(200).json({ delivered: false, message: 'If the account exists, an OTP was sent.' });
      return;
    }

    const result = await otpService.issue(email);
    response.status(200).json({
      delivered: result.delivered,
      expiresAt: result.expiresAt,
      // Returned only outside production to support local dev.
      previewCode: result.previewCode
    });
  }

  /** Step 3 (OTP): verify the code and issue a session JWT. */
  async verifyOtp(request: Request<unknown, unknown, OtpVerifyBody>, response: Response): Promise<void> {
    const email = request.body.email?.trim().toLowerCase();
    const code = request.body.code?.trim();
    if (!email || !code) {
      await this.recordFailure(request, 'otp', email, 'email_and_code_required');
      response.status(400).json({ message: 'email and code are required.' });
      return;
    }

    const ok = await otpService.verify(email, code);
    if (!ok) {
      await this.recordFailure(request, 'otp', email, 'invalid_or_expired_otp');
      response.status(401).json({ message: 'Invalid or expired OTP.' });
      return;
    }

    const user = await userService.resolveLogin(email, 'otp');
    if (!user) {
      await this.recordFailure(request, 'otp', email, 'otp_account_not_authorized');
      response.status(403).json({ message: 'Account is not allowed for OTP sign-in.' });
      return;
    }

    const session = tokenService.issue(user);
    await this.recordSuccess(request, user);
    response.status(200).json({ ...session, permissions: permissionsForRole(user.role) });
  }

  /** Step 2 (Entra ID): exchange MSAL id_token for a Fabric IQ session JWT. */
  async loginWithEntra(request: Request<unknown, unknown, EntraLoginBody>, response: Response): Promise<void> {
    const idToken = request.body.idToken?.trim();
    if (!idToken) {
      await this.recordFailure(request, 'entra_id', undefined, 'id_token_required');
      response.status(400).json({ message: 'idToken is required.' });
      return;
    }

    let attemptedEmail: string | undefined;
    try {
      const identity = await entraService.verifyIdToken(idToken);
      attemptedEmail = identity.email;
      const user = await userService.resolveLogin(identity.email, 'entra_id');
      if (!user) {
        await this.recordFailure(request, 'entra_id', identity.email, 'entra_account_not_authorized');
        response.status(403).json({ message: 'Account is not authorized for Entra ID sign-in.' });
        return;
      }

      // Refresh display name from the token if richer.
      if (identity.displayName && identity.displayName !== user.displayName) {
        await userService.upsert({
          id: user.id,
          email: user.email,
          displayName: identity.displayName,
          role: user.role,
          authMethod: 'entra_id',
          enabled: user.enabled
        });
        user.displayName = identity.displayName;
      }

      const session = tokenService.issue(user);
      await this.recordSuccess(request, user);
      response.status(200).json({ ...session, permissions: permissionsForRole(user.role) });
    } catch (error) {
      await this.recordFailure(
        request,
        'entra_id',
        attemptedEmail,
        error instanceof Error ? error.message : 'entra_sign_in_failed'
      );
      response.status(401).json({ message: error instanceof Error ? error.message : 'Entra ID sign-in failed.' });
    }
  }

  /** Returns the user profile for the bearer in the request. */
  async me(request: Request, response: Response): Promise<void> {
    if (!request.user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }
    response.status(200).json({
      user: request.user,
      permissions: permissionsForRole(request.user.role)
    });
  }

  async loginAsGuest(request: Request, response: Response): Promise<void> {
    const now = new Date().toISOString();
    const guestUser = {
      id: `guest-${Date.now()}`,
      email: 'guest@fabric-iq.local',
      displayName: 'Guest (read-only)',
      role: 'guest' as const,
      authMethod: 'guest' as const,
      enabled: true,
      createdAt: now,
      updatedAt: now
    };
    const session = tokenService.issue(guestUser);
    await this.recordSuccess(request, guestUser);
    response.status(200).json({ ...session, permissions: permissionsForRole('guest') });
  }

  async audit(_request: Request, response: Response): Promise<void> {
    const entries = await loginAuditService.list();
    response.status(200).json(entries);
  }

  private async recordFailure(
    request: Request<any, any, any, any>,
    method: AuthMethod,
    email: string | undefined,
    reason: string
  ): Promise<void> {
    await loginAuditService.record({
      method,
      outcome: 'failure',
      email,
      reason,
      ...this.requestMetadata(request)
    });
  }

  private async recordSuccess(request: Request<any, any, any, any>, user: AuthenticatedUser): Promise<void> {
    await loginAuditService.record({
      method: user.authMethod,
      outcome: 'success',
      email: user.email,
      userId: user.id,
      displayName: user.displayName,
      role: user.role,
      ...this.requestMetadata(request)
    });
  }

  private requestMetadata(request: Request<any, any, any, any>): { ipAddress?: string; userAgent?: string } {
    return {
      ipAddress: request.ip || undefined,
      userAgent: request.header('user-agent') ?? undefined
    };
  }
}
