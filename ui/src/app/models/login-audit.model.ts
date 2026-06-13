import { AuthMethod, UserRole } from './auth.model';

export type LoginAuditOutcome = 'success' | 'failure';

export interface LoginAuditRecord {
  id: string;
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
