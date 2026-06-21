import { randomUUID } from 'crypto';

import { environment } from '../config/environment';
import { Ontology, OntologyEntity, OntologyProperty, OntologyRelationship } from '../types/ontology.types';

const ENTITY_PATTERNS: Array<{ keyword: string; entityName: string; properties: OntologyProperty[] }> = [
  {
    keyword: 'customer',
    entityName: 'Customer',
    properties: [
      { id: 'customer-id', name: 'customer_id', type: 'string', sourceColumn: 'customer_id' },
      { id: 'customer-name', name: 'customer_name', type: 'string', sourceColumn: 'customer_name' }
    ]
  },
  {
    keyword: 'order',
    entityName: 'Order',
    properties: [
      { id: 'order-id', name: 'order_id', type: 'string', sourceColumn: 'order_id' },
      { id: 'order-date', name: 'order_date', type: 'date', sourceColumn: 'order_date' }
    ]
  },
  {
    keyword: 'product',
    entityName: 'Product',
    properties: [
      { id: 'product-id', name: 'product_id', type: 'string', sourceColumn: 'product_id' },
      { id: 'product-name', name: 'product_name', type: 'string', sourceColumn: 'product_name' }
    ]
  },
  {
    keyword: 'supplier',
    entityName: 'Supplier',
    properties: [
      { id: 'supplier-id', name: 'supplier_id', type: 'string', sourceColumn: 'supplier_id' },
      { id: 'supplier-name', name: 'supplier_name', type: 'string', sourceColumn: 'supplier_name' }
    ]
  }
];

export interface GenerateOntologyResult {
  ontology: Ontology;
  promptSummary: string;
}

export class OpenAiService {
  async generateOntologyDraft(businessCase: string): Promise<GenerateOntologyResult> {
    const normalizedPrompt = businessCase.trim().toLowerCase();
    const entities = this.inferEntities(normalizedPrompt);
    const relationships = this.inferRelationships(entities);
    const provider = environment.azureOpenAiEndpoint ? 'Azure OpenAI' : environment.openAiApiKey ? 'OpenAI' : 'placeholder AI';
    const now = new Date().toISOString();

    return {
      ontology: {
        id: randomUUID(),
        name: `${this.toTitleCase(this.pickDomainName(normalizedPrompt))} Ontology`,
        description: `Draft ontology generated for: ${businessCase.trim()}`,
        status: 'generated',
        businessCase: businessCase.trim(),
        createdAt: now,
        updatedAt: now,
        entities,
        relationships,
        bindings: []
      },
      promptSummary: `Generated with ${provider} using ${entities.length} inferred business entities.`
    };
  }

  private inferEntities(prompt: string): OntologyEntity[] {
    const matches = ENTITY_PATTERNS.filter((pattern) => prompt.includes(pattern.keyword)).map((pattern) => ({
      id: pattern.entityName.toLowerCase(),
      name: pattern.entityName,
      description: `${pattern.entityName} entity derived from the business case narrative.`,
      properties: pattern.properties
    }));

    if (matches.length) {
      return matches;
    }

    return [
      {
        id: 'business-concept',
        name: 'Business Concept',
        description: 'Primary concept extracted from the business case.',
        properties: [
          { id: 'concept-name', name: 'concept_name', type: 'string', sourceColumn: 'concept_name' },
          { id: 'concept-owner', name: 'concept_owner', type: 'string', sourceColumn: 'concept_owner' }
        ]
      }
    ];
  }

  private pickDomainName(prompt: string): string {
    const firstKeyword = ENTITY_PATTERNS.find((pattern) => prompt.includes(pattern.keyword));
    return firstKeyword?.entityName ?? 'Business';
  }

  private inferRelationships(entities: OntologyEntity[]): OntologyRelationship[] {
    if (entities.length < 2) {
      return [];
    }

    const relationships: OntologyRelationship[] = [];
    for (let i = 0; i < entities.length - 1; i += 1) {
      const from = entities[i];
      const to = entities[i + 1];
      relationships.push({
        id: `${from.id}-to-${to.id}`,
        name: `${from.name} to ${to.name}`,
        fromEntityId: from.id,
        toEntityId: to.id,
        cardinality: 'one-to-many',
        description: `${from.name} is related to ${to.name} in the business process.`
      });
    }
    return relationships;
  }

  private toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
