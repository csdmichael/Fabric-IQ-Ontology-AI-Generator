import { randomUUID } from 'crypto';

import { Ontology, OntologyInput } from '../types/ontology.types';

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
      ]
    };

    this.ontologies.set(seed.id, seed);
  }

  async listOntologies(): Promise<Ontology[]> {
    return Array.from(this.ontologies.values());
  }

  async getOntologyById(id: string): Promise<Ontology | undefined> {
    return this.ontologies.get(id);
  }

  async upsertOntology(input: OntologyInput): Promise<Ontology> {
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
      entities: input.entities ?? existing?.entities ?? []
    };

    this.ontologies.set(ontology.id, ontology);
    return ontology;
  }

  async deleteOntology(id: string): Promise<boolean> {
    return this.ontologies.delete(id);
  }
}
