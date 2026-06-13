import { AuthMethod, UserRole } from './auth.model';

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  authMethod: AuthMethod;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserUpsertInput {
  email: string;
  displayName: string;
  role: UserRole;
  authMethod: AuthMethod;
  enabled?: boolean;
}
