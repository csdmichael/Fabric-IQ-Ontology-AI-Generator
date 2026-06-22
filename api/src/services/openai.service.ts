import { randomUUID } from 'crypto';
import { AzureOpenAI } from 'openai';

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
  private readonly client = this.initializeClient();

  private initializeClient(): AzureOpenAI | null {
    if (environment.azureOpenAiEndpoint && environment.azureOpenAiKey) {
      return new AzureOpenAI({
        endpoint: environment.azureOpenAiEndpoint,
        apiKey: environment.azureOpenAiKey
      });
    }
    return null;
  }

  async generateOntologyDraft(businessCase: string): Promise<GenerateOntologyResult> {
    const now = new Date().toISOString();
    let entities: OntologyEntity[] = [];
    let promptSummary = '';

    // Try to use AI to generate entities
    if (this.client && environment.azureOpenAiDeployment) {
      try {
        const result = await this.withTimeout(
          this.generateEntitiesWithAI(businessCase),
          environment.openAiTimeoutMs,
          `Azure OpenAI generation timed out after ${environment.openAiTimeoutMs} ms`
        );
        entities = result.entities;
        promptSummary = result.promptSummary;
      } catch (error) {
        console.error('AI generation failed, falling back to pattern matching:', error);
        entities = this.inferEntitiesFromPatterns(businessCase.trim().toLowerCase());
        promptSummary = `Generated with fallback pattern matching (${entities.length} entities).`;
      }
    } else {
      // Fallback to pattern matching
      entities = this.inferEntitiesFromPatterns(businessCase.trim().toLowerCase());
      promptSummary = `Generated with pattern matching (${entities.length} entities).`;
    }

    const relationships = this.inferRelationships(entities);
    const domainName = this.extractDomainName(businessCase);

    return {
      ontology: {
        id: randomUUID(),
        name: `${domainName} Ontology`,
        description: `Draft ontology generated for: ${businessCase.trim()}`,
        status: 'generated',
        businessCase: businessCase.trim(),
        createdAt: now,
        updatedAt: now,
        entities,
        relationships,
        bindings: []
      },
      promptSummary
    };
  }

  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    try {
      return await Promise.race([operation, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async generateEntitiesWithAI(
    businessCase: string
  ): Promise<{ entities: OntologyEntity[]; promptSummary: string }> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const prompt = `You are an expert data architect. Analyze this business domain and extract 7-10 key business entities:

"${businessCase}"

Respond with ONLY a JSON object (no markdown, no code blocks) with this exact structure:
{
  "entities": [
    {
      "name": "EntityName",
      "description": "Brief description of what this entity represents",
      "properties": [
        {"name": "id", "type": "string"},
        {"name": "description_field", "type": "string"}
      ]
    }
  ]
}

Generate diverse entities that represent the core business concepts. Include at least 7 entities.`;

    const response = await (this.client as any).chat.completions.create({
      model: environment.azureOpenAiDeployment,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the JSON response
    const content = response.choices[0]?.message;
    if (!content || !content.content) {
      throw new Error('Unexpected response format from OpenAI');
    }

    let jsonText = content.content.trim();
    // Remove markdown code blocks if present
    jsonText = jsonText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(jsonText);

    // Transform OpenAI response to OntologyEntity format
    const entities: OntologyEntity[] = (parsed.entities || []).map(
      (entity: any, index: number) => ({
        id: entity.name.toLowerCase().replace(/\s+/g, '-'),
        name: entity.name,
        description: entity.description || `${entity.name} entity`,
        properties: (
          entity.properties || [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' }
          ]
        ).map((prop: any, idx: number) => ({
          id: `${entity.name.toLowerCase()}-${idx}`,
          name: prop.name || 'property',
          type: prop.type || 'string',
          sourceColumn: prop.name || 'property'
        }))
      })
    );

    return {
      entities: entities.slice(0, 10), // Cap at 10 entities
      promptSummary: `Generated with Azure OpenAI using ${entities.length} inferred business entities.`
    };
  }

  private inferEntitiesFromPatterns(prompt: string): OntologyEntity[] {
    const matches = ENTITY_PATTERNS.filter((pattern) => prompt.includes(pattern.keyword)).map((pattern) => ({
      id: pattern.entityName.toLowerCase(),
      name: pattern.entityName,
      description: `${pattern.entityName} entity derived from the business case narrative.`,
      properties: pattern.properties
    }));

    if (matches.length >= 3) {
      return matches;
    }

    // Return more default entities if patterns don't match well
    return [
      {
        id: 'business-concept',
        name: 'Business Concept',
        description: 'Primary concept extracted from the business case.',
        properties: [
          { id: 'concept-name', name: 'concept_name', type: 'string', sourceColumn: 'concept_name' },
          { id: 'concept-owner', name: 'concept_owner', type: 'string', sourceColumn: 'concept_owner' }
        ]
      },
      {
        id: 'stakeholder',
        name: 'Stakeholder',
        description: 'Person or organization involved in the business process.',
        properties: [
          { id: 'stakeholder-id', name: 'stakeholder_id', type: 'string', sourceColumn: 'stakeholder_id' },
          { id: 'stakeholder-role', name: 'stakeholder_role', type: 'string', sourceColumn: 'stakeholder_role' }
        ]
      },
      {
        id: 'transaction',
        name: 'Transaction',
        description: 'Business event or activity captured in the domain.',
        properties: [
          { id: 'transaction-id', name: 'transaction_id', type: 'string', sourceColumn: 'transaction_id' },
          { id: 'transaction-date', name: 'transaction_date', type: 'date', sourceColumn: 'transaction_date' }
        ]
      }
    ];
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

  private extractDomainName(businessCase: string): string {
    // Try to extract a meaningful domain name from the business case
    const firstKeyword = ENTITY_PATTERNS.find((pattern) => businessCase.toLowerCase().includes(pattern.keyword));
    if (firstKeyword) {
      return `${firstKeyword.entityName} Domain`;
    }

    // Extract first meaningful word(s) from the business case
    const words = businessCase
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 2)
      .join(' ');

    return words ? `${this.toTitleCase(words)} Domain` : 'Business Domain';
  }

  private toTitleCase(value: string): string {
    return value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
