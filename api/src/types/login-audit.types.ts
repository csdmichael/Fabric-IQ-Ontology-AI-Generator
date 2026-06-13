import { AuthMethod, UserRole } from './auth.types';

export type LoginAuditOutcome = 'success' | 'failure';

export interface LoginAuditRecord {
  id: string;
  type: 'login_audit';
  at: string;
  method: AuthMethod;
  outcome: LoginAuditOutcome;
  email?: string;
  userId?: string;
  displayName?: string;
  role?: UserRole;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginAuditInput {
  method: AuthMethod;
  outcome: LoginAuditOutcome;
  email?: string;
  userId?: string;
  displayName?: string;
  role?: UserRole;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}
