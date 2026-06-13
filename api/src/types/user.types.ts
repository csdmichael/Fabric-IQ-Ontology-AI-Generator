import { AuthMethod, UserRole } from './auth.types';

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
  id?: string;
  email: string;
  displayName?: string;
  role: UserRole;
  authMethod: AuthMethod;
  enabled?: boolean;
}
