import { randomUUID } from 'crypto';

import { Container, CosmosClient } from '@azure/cosmos';

import { environment } from '../config/environment';
import { LoginAuditInput, LoginAuditRecord } from '../types/login-audit.types';

const FALLBACK_LIMIT = 100;

/**
 * Writes login audit events to Cosmos DB when configured, with an in-memory
 * fallback for local development and disconnected environments.
 */
export class LoginAuditService {
  private readonly fallback = new Map<string, LoginAuditRecord>();
  private containerPromise: Promise<Container | null> | undefined;

  async list(limit = FALLBACK_LIMIT): Promise<LoginAuditRecord[]> {
    const fallbackEntries = Array.from(this.fallback.values());
    const container = await this.getContainer();
    if (!container) {
      return this.sortAndLimit(fallbackEntries, limit);
    }

    try {
      const { resources } = await container.items
        .query<LoginAuditRecord>({
          query: 'SELECT * FROM c WHERE c.type = @type ORDER BY c.at DESC',
          parameters: [{ name: '@type', value: 'login_audit' }]
        })
        .fetchAll();
      return this.sortAndLimit([...resources, ...fallbackEntries], limit);
    } catch (error) {
      console.warn('[LoginAuditService] Failed to read Cosmos audit records, using fallback store.', error);
      return this.sortAndLimit(fallbackEntries, limit);
    }
  }

  async record(input: LoginAuditInput): Promise<LoginAuditRecord> {
    const record: LoginAuditRecord = {
      id: randomUUID(),
      type: 'login_audit',
      at: new Date().toISOString(),
      method: input.method,
      outcome: input.outcome,
      email: input.email?.trim().toLowerCase(),
      userId: input.userId,
      displayName: input.displayName,
      role: input.role,
      reason: input.reason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    };

    this.fallback.set(record.id, record);

    const container = await this.getContainer();
    if (!container) {
      return record;
    }

    try {
      await container.items.upsert(record);
    } catch (error) {
      console.warn('[LoginAuditService] Failed to persist login audit record to Cosmos DB.', error);
    }

    return record;
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
        id: environment.cosmosLoginAuditContainer,
        partitionKey: {
          paths: ['/method']
        }
      });
      return container;
    } catch (error) {
      console.warn('[LoginAuditService] Cosmos DB unavailable, using in-memory audit store.', error);
      return null;
    }
  }

  private sortAndLimit(records: LoginAuditRecord[], limit: number): LoginAuditRecord[] {
    return records
      .sort((left, right) => right.at.localeCompare(left.at))
      .slice(0, limit);
  }
}

export const loginAuditService = new LoginAuditService();
