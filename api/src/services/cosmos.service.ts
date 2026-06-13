import { randomUUID } from 'crypto';

import { Ontology, OntologyHistoryEntry, OntologyInput, OntologyStatus } from '../types/ontology.types';
import { AuthenticatedUser } from '../types/auth.types';

export interface OntologyAction {
  actor: AuthenticatedUser;
  action: string;
  note?: string;
  status?: OntologyStatus;
}

export class CosmosService {
  private readonly ontologies = new Map<string, Ontology>();

  constructor() {
    const seed: Ontology = {
      id: 'sample-sales-ontology',
      name: 'Sales Analytics Ontology',
      description: 'Seed ontology for customer, order, and revenue analysis.',
      status: 'generated',
      businessCase: 'Model customers, orders, and revenue for a sales analytics scenario.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system@fabric-iq',
      lastModifiedBy: 'system@fabric-iq',
      history: [
        { at: new Date().toISOString(), actor: 'system@fabric-iq', role: 'app_owner', action: 'seeded' }
      ],
      entities: [
        {
          id: 'customer',
          name: 'Customer',
          description: 'Represents a business customer.',
          sourceTable: 'lakehouse.sales_customers',
          properties: [
            { id: 'customer-id', name: 'customer_id', type: 'string', sourceColumn: 'customer_id' }
          ]
        }
      ],
      relationships: []
    };

    this.ontologies.set(seed.id, seed);
  }

  async listOntologies(): Promise<Ontology[]> {
    return Array.from(this.ontologies.values());
  }

  async getOntologyById(id: string): Promise<Ontology | undefined> {
    return this.ontologies.get(id);
  }

  async upsertOntology(input: OntologyInput, actor?: AuthenticatedUser): Promise<Ontology> {
    const existing = input.id ? this.ontologies.get(input.id) : undefined;
    const now = new Date().toISOString();
    const ontology: Ontology = {
      id: input.id || existing?.id || randomUUID(),
      name: input.name ?? existing?.name ?? 'Untitled ontology',
      description: input.description ?? existing?.description ?? 'Ontology draft',
      status: input.status ?? existing?.status ?? 'draft',
      businessCase: input.businessCase ?? existing?.businessCase,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      entities: input.entities ?? existing?.entities ?? [],
      relationships: input.relationships ?? existing?.relationships ?? [],
      history: existing?.history ?? [],
      createdBy: existing?.createdBy ?? actor?.email ?? 'anonymous',
      lastModifiedBy: actor?.email ?? existing?.lastModifiedBy,
      blobUri: input.blobUri ?? existing?.blobUri,
      fabricArtifactId: input.fabricArtifactId ?? existing?.fabricArtifactId
    };

    if (actor) {
      ontology.history = [
        ...(ontology.history ?? []),
        { at: now, actor: actor.email, role: actor.role, action: existing ? 'updated' : 'created' }
      ];
    }

    this.ontologies.set(ontology.id, ontology);
    return ontology;
  }

  async deleteOntology(id: string): Promise<boolean> {
    return this.ontologies.delete(id);
  }

  /**
   * Applies a workflow transition (submit-for-binding, deploy, etc.) atomically
   * with history bookkeeping.
   */
  async applyAction(id: string, action: OntologyAction): Promise<Ontology | undefined> {
    const ontology = this.ontologies.get(id);
    if (!ontology) {
      return undefined;
    }

    const entry: OntologyHistoryEntry = {
      at: new Date().toISOString(),
      actor: action.actor.email,
      role: action.actor.role,
      action: action.action,
      note: action.note
    };

    ontology.history = [...(ontology.history ?? []), entry];
    if (action.status) {
      ontology.status = action.status;
    }
    ontology.updatedAt = entry.at;
    ontology.lastModifiedBy = action.actor.email;

    this.ontologies.set(id, ontology);
    return ontology;
  }
}

export const cosmosService = new CosmosService();
