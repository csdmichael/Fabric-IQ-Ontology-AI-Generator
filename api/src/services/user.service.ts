import { randomUUID } from 'crypto';

import { Container, CosmosClient } from '@azure/cosmos';

import { environment } from '../config/environment';
import { ROLE_HIERARCHY } from '../config/roles';
import { AuthMethod, UserRole } from '../types/auth.types';
import { UserRecord, UserUpsertInput } from '../types/user.types';

interface UserDocument extends UserRecord {
  type: 'user';
}

const USER_DOCUMENT_TYPE = 'user';

const SEED_APP_OWNERS: Array<Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    email: 'admin@mngenvmcap829495.onmicrosoft.com',
    displayName: 'Admin (App Owner)',
    role: 'app_owner',
    authMethod: 'entra_id',
    enabled: true
  },
  {
    email: 'myaacoub@mngenvmcap829495.onmicrosoft.com',
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
  private containerPromise: Promise<Container | null> | undefined;

  constructor() {
    const now = new Date().toISOString();
    for (const seed of SEED_APP_OWNERS) {
      const id = randomUUID();
      const record: UserRecord = {
        ...seed,
        email: seed.email.toLowerCase(),
        id,
        createdAt: now,
        updatedAt: now
      };
      this.users.set(id, record);
      this.byEmail.set(record.email, id);
    }

    // Best effort: ensure seed app owners exist in Cosmos when configured.
    void this.ensureSeedUsers();
  }

  async list(): Promise<UserRecord[]> {
    const local = Array.from(this.users.values());
    const container = await this.getContainer();
    if (!container) {
      return this.sortByEmail(local);
    }

    try {
      const { resources } = await container.items
        .query<UserDocument>({
          query: 'SELECT * FROM c WHERE c.type = @type',
          parameters: [{ name: '@type', value: USER_DOCUMENT_TYPE }]
        })
        .fetchAll();

      for (const resource of resources) {
        this.cache(this.toUser(resource));
      }
      return this.sortByEmail(Array.from(this.users.values()));
    } catch (error) {
      console.warn('[UserService] Failed to list users from Cosmos DB, using fallback store.', error);
      return this.sortByEmail(local);
    }
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    const local = this.users.get(id);
    if (local) {
      return local;
    }

    const container = await this.getContainer();
    if (!container) {
      return undefined;
    }

    try {
      const { resources } = await container.items
        .query<UserDocument>({
          query: 'SELECT TOP 1 * FROM c WHERE c.type = @type AND c.id = @id',
          parameters: [
            { name: '@type', value: USER_DOCUMENT_TYPE },
            { name: '@id', value: id }
          ]
        })
        .fetchAll();

      const user = resources[0] ? this.toUser(resources[0]) : undefined;
      if (user) {
        this.cache(user);
      }
      return user;
    } catch (error) {
      console.warn('[UserService] Failed to find user by id from Cosmos DB.', error);
      return undefined;
    }
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const normalized = email.trim().toLowerCase();
    const id = this.byEmail.get(normalized);
    const local = id ? this.users.get(id) : undefined;
    if (local) {
      return local;
    }

    const container = await this.getContainer();
    if (!container) {
      return undefined;
    }

    try {
      const { resources } = await container.items
        .query<UserDocument>({
          query: 'SELECT TOP 1 * FROM c WHERE c.type = @type AND c.email = @email',
          parameters: [
            { name: '@type', value: USER_DOCUMENT_TYPE },
            { name: '@email', value: normalized }
          ]
        })
        .fetchAll();

      const user = resources[0] ? this.toUser(resources[0]) : undefined;
      if (user) {
        this.cache(user);
      }
      return user;
    } catch (error) {
      console.warn('[UserService] Failed to find user by email from Cosmos DB.', error);
      return undefined;
    }
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
      return this.touchLastLogin(existing);
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

    this.cache(record);

    const container = await this.getContainer();
    if (container) {
      try {
        await container.items.upsert(this.toDocument(record));
      } catch (error) {
        console.warn('[UserService] Failed to persist user to Cosmos DB.', error);
      }
    }

    return record;
  }

  async remove(id: string): Promise<boolean> {
    const existing = this.users.get(id);
    if (!existing) {
      return false;
    }
    this.users.delete(id);
    this.byEmail.delete(existing.email);

    const container = await this.getContainer();
    if (container) {
      try {
        await container.item(id, id).delete();
      } catch (error) {
        console.warn('[UserService] Failed to delete user from Cosmos DB.', error);
      }
    }

    return true;
  }

  private async touchLastLogin(record: UserRecord): Promise<UserRecord> {
    const now = new Date().toISOString();
    const updated: UserRecord = {
      ...record,
      lastLoginAt: now,
      updatedAt: now
    };
    this.cache(updated);

    const container = await this.getContainer();
    if (container) {
      try {
        await container.items.upsert(this.toDocument(updated));
      } catch (error) {
        console.warn('[UserService] Failed to update login timestamp in Cosmos DB.', error);
      }
    }

    return updated;
  }

  private async ensureSeedUsers(): Promise<void> {
    for (const seed of SEED_APP_OWNERS) {
      await this.upsert({
        email: seed.email,
        displayName: seed.displayName,
        role: seed.role,
        authMethod: seed.authMethod,
        enabled: seed.enabled
      });
    }
  }

  private cache(record: UserRecord): void {
    this.users.set(record.id, record);
    this.byEmail.set(record.email, record.id);
  }

  private toDocument(record: UserRecord): UserDocument {
    return {
      ...record,
      type: USER_DOCUMENT_TYPE
    };
  }

  private toUser(document: UserDocument): UserRecord {
    const { type: _type, ...record } = document;
    return {
      ...record,
      email: record.email.toLowerCase()
    };
  }

  private sortByEmail(users: UserRecord[]): UserRecord[] {
    return users.sort((a, b) => a.email.localeCompare(b.email));
  }

  private async getContainer(): Promise<Container | null> {
    if (!environment.cosmosEndpoint || !environment.cosmosKey) {
      return null;
    }
    if (!this.containerPromise) {
      this.containerPromise = this.initializeContainer();
    }
    return this.containerPromise;
  }

  private async initializeContainer(): Promise<Container | null> {
    try {
      const client = new CosmosClient({
        endpoint: environment.cosmosEndpoint,
        key: environment.cosmosKey
      });
      const { database } = await client.databases.createIfNotExists({
        id: environment.cosmosDatabase
      });
      const { container } = await database.containers.createIfNotExists({
        id: environment.cosmosUsersContainer,
        partitionKey: {
          paths: ['/id']
        }
      });
      return container;
    } catch (error) {
      console.warn('[UserService] Cosmos DB unavailable, using in-memory user store.', error);
      return null;
    }
  }
}

export const userService = new UserService();
