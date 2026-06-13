import { randomUUID } from 'crypto';

import { environment } from '../config/environment';
import { ROLE_HIERARCHY } from '../config/roles';
import { AuthMethod, UserRole } from '../types/auth.types';
import { UserRecord, UserUpsertInput } from '../types/user.types';

const SEED_APP_OWNERS: Array<Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    email: 'admin@MngEnvMCAP829495.onmicrosoft.com',
    displayName: 'Admin (App Owner)',
    role: 'app_owner',
    authMethod: 'entra_id',
    enabled: true
  },
  {
    email: 'myaacoub@MngEnvMCAP829495.onmicrosoft.com',
    displayName: 'Michael Yaacoub (App Owner)',
    role: 'app_owner',
    authMethod: 'entra_id',
    enabled: true
  },
  {
    email: 'myaacoub@microsoft.com',
    displayName: 'Michael Yaacoub (Microsoft - OTP)',
    role: 'app_owner',
    authMethod: 'otp',
    enabled: true
  }
];

/**
 * In-memory user store that mirrors the planned Cosmos DB container shape.
 * Swap the internal Map with `@azure/cosmos` Container.items.* calls once a
 * private endpoint to Cosmos is available.
 */
export class UserService {
  private readonly users = new Map<string, UserRecord>();
  private readonly byEmail = new Map<string, string>();

  constructor() {
    const now = new Date().toISOString();
    for (const seed of SEED_APP_OWNERS) {
      const id = randomUUID();
      const record: UserRecord = { ...seed, id, createdAt: now, updatedAt: now };
      this.users.set(id, record);
      this.byEmail.set(seed.email.toLowerCase(), id);
    }
  }

  async list(): Promise<UserRecord[]> {
    return Array.from(this.users.values()).sort((a, b) => a.email.localeCompare(b.email));
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    return this.users.get(id);
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const normalized = email.trim().toLowerCase();
    const id = this.byEmail.get(normalized);
    return id ? this.users.get(id) : undefined;
  }

  /**
   * Resolves the user that should be issued a session for a given email + method.
   *
   * - Seeded App Owners always match.
   * - Anyone in the configured Entra ID domain auto-onboards as a business_user
   *   the first time they sign in with Entra ID (auditable, can be promoted by an App Owner).
   * - OTP users must be explicitly added by an App Owner.
   */
  async resolveLogin(email: string, method: AuthMethod): Promise<UserRecord | undefined> {
    const existing = await this.findByEmail(email);
    if (existing) {
      if (!existing.enabled) {
        return undefined;
      }
      if (existing.authMethod !== method) {
        return undefined;
      }
      existing.lastLoginAt = new Date().toISOString();
      existing.updatedAt = existing.lastLoginAt;
      return existing;
    }

    if (method === 'entra_id' && email.toLowerCase().endsWith(environment.authAllowedEntraDomain)) {
      return this.upsert({
        email,
        displayName: email.split('@')[0],
        role: 'business_user',
        authMethod: 'entra_id',
        enabled: true
      });
    }

    return undefined;
  }

  async upsert(input: UserUpsertInput): Promise<UserRecord> {
    const now = new Date().toISOString();
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = input.id ? this.users.get(input.id) : await this.findByEmail(normalizedEmail);

    const role: UserRole = ROLE_HIERARCHY.includes(input.role) ? input.role : 'business_user';
    const authMethod: AuthMethod = input.authMethod === 'otp' ? 'otp' : 'entra_id';

    const record: UserRecord = {
      id: existing?.id ?? randomUUID(),
      email: normalizedEmail,
      displayName: input.displayName ?? existing?.displayName ?? normalizedEmail,
      role,
      authMethod,
      enabled: input.enabled ?? existing?.enabled ?? true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastLoginAt: existing?.lastLoginAt
    };

    this.users.set(record.id, record);
    this.byEmail.set(record.email, record.id);
    return record;
  }

  async remove(id: string): Promise<boolean> {
    const existing = this.users.get(id);
    if (!existing) {
      return false;
    }
    this.users.delete(id);
    this.byEmail.delete(existing.email);
    return true;
  }
}

export const userService = new UserService();
