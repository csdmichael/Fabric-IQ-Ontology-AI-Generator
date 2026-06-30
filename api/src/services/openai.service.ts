import { randomUUID } from 'crypto';
import { AzureOpenAI } from 'openai';

import { environment } from '../config/environment';
import { Ontology, OntologyEntity, OntologyProperty, OntologyPropertyType, OntologyRelationship } from '../types/ontology.types';

const ENTITY_PATTERNS: Array<{ keyword: string; entityName: string; properties: OntologyProperty[] }> = [
  {
    keyword: 'customer',
    entityName: 'Customer',
    properties: [
      { id: 'customer-id', name: 'customer_id', type: 'string', sourceColumn: 'customer_id' },
      { id: 'customer-name', name: 'customer_name', type: 'string', sourceColumn: 'customer_name' },
      { id: 'customer-segment', name: 'segment', type: 'string', sourceColumn: 'segment' },
      { id: 'customer-region', name: 'region', type: 'string', sourceColumn: 'region' },
      { id: 'customer-email', name: 'email', type: 'string', sourceColumn: 'email' },
      { id: 'customer-credit-limit', name: 'credit_limit', type: 'number', sourceColumn: 'credit_limit' },
      { id: 'customer-active', name: 'is_active', type: 'boolean', sourceColumn: 'is_active' },
      { id: 'customer-created', name: 'created_date', type: 'date', sourceColumn: 'created_date' }
    ]
  },
  {
    keyword: 'order',
    entityName: 'Order',
    properties: [
      { id: 'order-id', name: 'order_id', type: 'string', sourceColumn: 'order_id' },
      { id: 'order-customer', name: 'customer_id', type: 'reference', sourceColumn: 'customer_id' },
      { id: 'order-date', name: 'order_date', type: 'date', sourceColumn: 'order_date' },
      { id: 'order-status', name: 'status', type: 'string', sourceColumn: 'status' },
      { id: 'order-total', name: 'total_amount', type: 'number', sourceColumn: 'total_amount' },
      { id: 'order-currency', name: 'currency', type: 'string', sourceColumn: 'currency' },
      { id: 'order-priority', name: 'priority', type: 'string', sourceColumn: 'priority' },
      { id: 'order-required-date', name: 'required_date', type: 'date', sourceColumn: 'required_date' }
    ]
  },
  {
    keyword: 'product',
    entityName: 'Product',
    properties: [
      { id: 'product-id', name: 'product_id', type: 'string', sourceColumn: 'product_id' },
      { id: 'product-name', name: 'product_name', type: 'string', sourceColumn: 'product_name' },
      { id: 'product-category', name: 'category', type: 'string', sourceColumn: 'category' },
      { id: 'product-sku', name: 'sku', type: 'string', sourceColumn: 'sku' },
      { id: 'product-unit-price', name: 'unit_price', type: 'number', sourceColumn: 'unit_price' },
      { id: 'product-uom', name: 'unit_of_measure', type: 'string', sourceColumn: 'unit_of_measure' },
      { id: 'product-lifecycle', name: 'lifecycle_status', type: 'string', sourceColumn: 'lifecycle_status' },
      { id: 'product-launch', name: 'launch_date', type: 'date', sourceColumn: 'launch_date' }
    ]
  },
  {
    keyword: 'supplier',
    entityName: 'Supplier',
    properties: [
      { id: 'supplier-id', name: 'supplier_id', type: 'string', sourceColumn: 'supplier_id' },
      { id: 'supplier-name', name: 'supplier_name', type: 'string', sourceColumn: 'supplier_name' },
      { id: 'supplier-tier', name: 'tier', type: 'string', sourceColumn: 'tier' },
      { id: 'supplier-country', name: 'country', type: 'string', sourceColumn: 'country' },
      { id: 'supplier-rating', name: 'performance_rating', type: 'number', sourceColumn: 'performance_rating' },
      { id: 'supplier-lead-time', name: 'lead_time_days', type: 'number', sourceColumn: 'lead_time_days' },
      { id: 'supplier-preferred', name: 'is_preferred', type: 'boolean', sourceColumn: 'is_preferred' },
      { id: 'supplier-onboarded', name: 'onboarded_date', type: 'date', sourceColumn: 'onboarded_date' }
    ]
  },
  {
    keyword: 'part',
    entityName: 'Part',
    properties: [
      { id: 'part-id', name: 'part_id', type: 'string', sourceColumn: 'part_id' },
      { id: 'part-number', name: 'part_number', type: 'string', sourceColumn: 'part_number' },
      { id: 'part-description', name: 'description', type: 'string', sourceColumn: 'description' },
      { id: 'part-commodity', name: 'commodity', type: 'string', sourceColumn: 'commodity' },
      { id: 'part-on-hand', name: 'on_hand_qty', type: 'number', sourceColumn: 'on_hand_qty' },
      { id: 'part-safety-stock', name: 'safety_stock', type: 'number', sourceColumn: 'safety_stock' },
      { id: 'part-lead-time', name: 'lead_time_days', type: 'number', sourceColumn: 'lead_time_days' },
      { id: 'part-critical', name: 'is_critical', type: 'boolean', sourceColumn: 'is_critical' }
    ]
  },
  {
    keyword: 'shortage',
    entityName: 'PartShortage',
    properties: [
      { id: 'shortage-id', name: 'shortage_id', type: 'string', sourceColumn: 'shortage_id' },
      { id: 'shortage-part', name: 'part_id', type: 'reference', sourceColumn: 'part_id' },
      { id: 'shortage-qty', name: 'shortage_qty', type: 'number', sourceColumn: 'shortage_qty' },
      { id: 'shortage-severity', name: 'severity', type: 'string', sourceColumn: 'severity' },
      { id: 'shortage-status', name: 'status', type: 'string', sourceColumn: 'status' },
      { id: 'shortage-need-by', name: 'need_by_date', type: 'date', sourceColumn: 'need_by_date' },
      { id: 'shortage-detected', name: 'detected_date', type: 'date', sourceColumn: 'detected_date' }
    ]
  },
  {
    keyword: 'demand',
    entityName: 'MaterialDemandPlan',
    properties: [
      { id: 'demand-id', name: 'demand_plan_id', type: 'string', sourceColumn: 'demand_plan_id' },
      { id: 'demand-part', name: 'part_id', type: 'reference', sourceColumn: 'part_id' },
      { id: 'demand-period', name: 'planning_period', type: 'string', sourceColumn: 'planning_period' },
      { id: 'demand-required', name: 'required_qty', type: 'number', sourceColumn: 'required_qty' },
      { id: 'demand-forecast', name: 'forecast_qty', type: 'number', sourceColumn: 'forecast_qty' },
      { id: 'demand-due', name: 'due_date', type: 'date', sourceColumn: 'due_date' }
    ]
  },
  {
    keyword: 'purchase',
    entityName: 'PurchaseCommitment',
    properties: [
      { id: 'po-id', name: 'commitment_id', type: 'string', sourceColumn: 'commitment_id' },
      { id: 'po-supplier', name: 'supplier_id', type: 'reference', sourceColumn: 'supplier_id' },
      { id: 'po-part', name: 'part_id', type: 'reference', sourceColumn: 'part_id' },
      { id: 'po-qty', name: 'committed_qty', type: 'number', sourceColumn: 'committed_qty' },
      { id: 'po-status', name: 'status', type: 'string', sourceColumn: 'status' },
      { id: 'po-promised', name: 'promised_date', type: 'date', sourceColumn: 'promised_date' },
      { id: 'po-value', name: 'commitment_value', type: 'number', sourceColumn: 'commitment_value' }
    ]
  },
  {
    keyword: 'quality',
    entityName: 'QualitySignal',
    properties: [
      { id: 'quality-id', name: 'signal_id', type: 'string', sourceColumn: 'signal_id' },
      { id: 'quality-part', name: 'part_id', type: 'reference', sourceColumn: 'part_id' },
      { id: 'quality-type', name: 'signal_type', type: 'string', sourceColumn: 'signal_type' },
      { id: 'quality-score', name: 'quality_score', type: 'number', sourceColumn: 'quality_score' },
      { id: 'quality-defect-rate', name: 'defect_rate', type: 'number', sourceColumn: 'defect_rate' },
      { id: 'quality-captured', name: 'captured_date', type: 'date', sourceColumn: 'captured_date' }
    ]
  },
  {
    keyword: 'machine',
    entityName: 'MachineBuild',
    properties: [
      { id: 'build-id', name: 'build_id', type: 'string', sourceColumn: 'build_id' },
      { id: 'build-product', name: 'product_id', type: 'reference', sourceColumn: 'product_id' },
      { id: 'build-line', name: 'production_line', type: 'string', sourceColumn: 'production_line' },
      { id: 'build-qty', name: 'build_qty', type: 'number', sourceColumn: 'build_qty' },
      { id: 'build-status', name: 'status', type: 'string', sourceColumn: 'status' },
      { id: 'build-scheduled', name: 'scheduled_date', type: 'date', sourceColumn: 'scheduled_date' }
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
    let relationships: OntologyRelationship[] = [];
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
        relationships = result.relationships;
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

    // If the AI did not return usable relationships, derive a connected graph locally.
    if (relationships.length === 0) {
      relationships = this.inferRelationships(entities);
    }
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
  ): Promise<{ entities: OntologyEntity[]; relationships: OntologyRelationship[]; promptSummary: string }> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const prompt = `You are an expert enterprise data architect and ontology engineer. Design a RICH, detailed business ontology for the domain below.

"${businessCase}"

Design requirements:
- Produce AT LEAST 10 distinct business entities (12-15 preferred). Cover core objects, business events, plans, signals/measures, catalogs, and reference/master-data concepts in the domain.
- Each entity MUST have between 6 and 12 properties. Always include a primary identifier plus a mix of descriptive attributes, status/category fields, quantitative measures, and date/time fields where relevant.
- Use property "type" values from this set ONLY: "string", "number", "boolean", "date", "reference".
- Write a clear, specific one-sentence description for each entity (max 20 words).
- Define MEANINGFUL relationships between entities using domain verbs (e.g. affects, consumes, clears, hasDemandPlan, hasQualitySignal, forPart). Provide at least 8 relationships and reference entities by their exact "name".
- Use "cardinality" values from: "one-to-one", "one-to-many", "many-to-many".

Return ONLY a JSON object with this exact structure:
{"entities":[{"name":"EntityName","description":"Short description","properties":[{"name":"field_name","type":"string"}]}],"relationships":[{"from":"EntityName","to":"OtherEntity","name":"verbPhrase","cardinality":"one-to-many","description":"Short description"}]}`;

    const response = await (this.client as any).chat.completions.create({
      model: environment.azureOpenAiDeployment,
      max_tokens: 4096,
      temperature: 0.3,
      response_format: { type: 'json_object' },
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
    const slug = (value: string): string => value.toLowerCase().trim().replace(/\s+/g, '-');

    // Transform OpenAI response to OntologyEntity format
    const entities: OntologyEntity[] = (parsed.entities || []).map((entity: any) => ({
      id: slug(entity.name),
      name: entity.name,
      description: entity.description || `${entity.name} entity`,
      properties: (
        entity.properties || [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' }
        ]
      ).map((prop: any, idx: number) => ({
        id: `${slug(entity.name)}-${idx}`,
        name: prop.name || 'property',
        type: this.normalizePropertyType(prop.type),
        sourceColumn: prop.name || 'property'
      }))
    }));

    const cappedEntities = entities.slice(0, 25);
    const entityIds = new Set(cappedEntities.map((entity) => entity.id));

    // Transform AI relationships, keeping only those referencing known entities.
    const relationships: OntologyRelationship[] = (parsed.relationships || [])
      .map((rel: any) => {
        const fromId = slug(rel.from ?? rel.source ?? '');
        const toId = slug(rel.to ?? rel.target ?? '');
        if (!entityIds.has(fromId) || !entityIds.has(toId) || fromId === toId) {
          return undefined;
        }
        return {
          id: `${fromId}-${slug(rel.name ?? 'relatesTo')}-${toId}`,
          name: rel.name || 'relatesTo',
          fromEntityId: fromId,
          toEntityId: toId,
          cardinality: this.normalizeCardinality(rel.cardinality),
          description: rel.description || `${rel.from} ${rel.name || 'relates to'} ${rel.to}.`
        } as OntologyRelationship;
      })
      .filter((rel: OntologyRelationship | undefined): rel is OntologyRelationship => rel !== undefined);

    return {
      entities: cappedEntities,
      relationships,
      promptSummary: `Generated with Azure OpenAI: ${cappedEntities.length} entities and ${relationships.length} relationships.`
    };
  }

  private normalizePropertyType(type: unknown): OntologyPropertyType {
    const allowed: OntologyPropertyType[] = ['string', 'number', 'boolean', 'date', 'reference'];
    const value = typeof type === 'string' ? type.toLowerCase().trim() : '';
    if ((allowed as string[]).includes(value)) {
      return value as OntologyPropertyType;
    }
    if (['int', 'integer', 'float', 'double', 'decimal', 'long'].includes(value)) {
      return 'number';
    }
    if (['datetime', 'timestamp', 'time'].includes(value)) {
      return 'date';
    }
    return 'string';
  }

  private normalizeCardinality(value: unknown): OntologyRelationship['cardinality'] {
    const allowed = ['one-to-one', 'one-to-many', 'many-to-many'];
    const normalized = typeof value === 'string' ? value.toLowerCase().trim() : '';
    return (allowed.includes(normalized) ? normalized : 'one-to-many') as OntologyRelationship['cardinality'];
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
          { id: 'concept-id', name: 'concept_id', type: 'string', sourceColumn: 'concept_id' },
          { id: 'concept-name', name: 'concept_name', type: 'string', sourceColumn: 'concept_name' },
          { id: 'concept-category', name: 'category', type: 'string', sourceColumn: 'category' },
          { id: 'concept-owner', name: 'concept_owner', type: 'string', sourceColumn: 'concept_owner' },
          { id: 'concept-status', name: 'status', type: 'string', sourceColumn: 'status' },
          { id: 'concept-active', name: 'is_active', type: 'boolean', sourceColumn: 'is_active' },
          { id: 'concept-created', name: 'created_date', type: 'date', sourceColumn: 'created_date' }
        ]
      },
      {
        id: 'stakeholder',
        name: 'Stakeholder',
        description: 'Person or organization involved in the business process.',
        properties: [
          { id: 'stakeholder-id', name: 'stakeholder_id', type: 'string', sourceColumn: 'stakeholder_id' },
          { id: 'stakeholder-name', name: 'stakeholder_name', type: 'string', sourceColumn: 'stakeholder_name' },
          { id: 'stakeholder-role', name: 'stakeholder_role', type: 'string', sourceColumn: 'stakeholder_role' },
          { id: 'stakeholder-org', name: 'organization', type: 'string', sourceColumn: 'organization' },
          { id: 'stakeholder-email', name: 'email', type: 'string', sourceColumn: 'email' },
          { id: 'stakeholder-active', name: 'is_active', type: 'boolean', sourceColumn: 'is_active' }
        ]
      },
      {
        id: 'transaction',
        name: 'Transaction',
        description: 'Business event or activity captured in the domain.',
        properties: [
          { id: 'transaction-id', name: 'transaction_id', type: 'string', sourceColumn: 'transaction_id' },
          { id: 'transaction-concept', name: 'concept_id', type: 'reference', sourceColumn: 'concept_id' },
          { id: 'transaction-type', name: 'transaction_type', type: 'string', sourceColumn: 'transaction_type' },
          { id: 'transaction-amount', name: 'amount', type: 'number', sourceColumn: 'amount' },
          { id: 'transaction-status', name: 'status', type: 'string', sourceColumn: 'status' },
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
