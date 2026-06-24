export type OntologyPropertyType = 'string' | 'number' | 'boolean' | 'date' | 'reference';

export type OntologyStatus =
  | 'draft'
  | 'generated'
  | 'awaiting_data_binding'
  | 'binding_in_progress'
  | 'awaiting_deployment'
  | 'deploying'
  | 'published'
  | 'rejected';

/** Human-friendly labels for each ontology lifecycle status. */
export const ONTOLOGY_STATUS_LABELS: Record<OntologyStatus, string> = {
  draft: 'Draft',
  generated: 'Generated',
  awaiting_data_binding: 'Awaiting data binding',
  binding_in_progress: 'Bound to data',
  awaiting_deployment: 'Ready to deploy',
  deploying: 'Deploying',
  published: 'Published',
  rejected: 'Rejected'
};

/** Returns a readable label for an ontology status, falling back to the raw value. */
export function ontologyStatusLabel(status?: OntologyStatus | string): string {
  if (!status) {
    return 'Unknown';
  }
  return ONTOLOGY_STATUS_LABELS[status as OntologyStatus] ?? status;
}

export interface OntologyProperty {
  id: string;
  name: string;
  type: OntologyPropertyType;
  description?: string;
  /** Lakehouse table or view that backs the entity, propagated from entity.sourceTable when blank. */
  sourceTable?: string;
  /** Lakehouse view (when binding goes through a curated view instead of a base table). */
  sourceView?: string;
  /** Column inside sourceTable / sourceView. */
  sourceColumn?: string;
  required?: boolean;
}

export interface OntologyEntity {
  id: string;
  name: string;
  description: string;
  /** Default Fabric Lakehouse table that backs every unbound property of this entity. */
  sourceTable?: string;
  /** Optional Fabric Lakehouse view alternative to sourceTable. */
  sourceView?: string;
  properties: OntologyProperty[];
}

export interface OntologyRelationship {
  id: string;
  name: string;
  fromEntityId: string;
  toEntityId: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many';
  description?: string;
}

export interface OntologyBinding {
  id: string;
  entityId: string;
  propertyId?: string;
  lakehouseTable: string;
  lakehouseView?: string;
  sourceField: string;
  notes?: string;
}

export interface OntologyArtifactFile {
  type: 'ttl' | 'entities-json' | 'relationships-json' | 'bindings-json';
  blobName: string;
  uri: string;
}

export interface OntologyHistoryEntry {
  actor: string;
  action: string;
  status: OntologyStatus;
  note?: string;
  timestamp: string;
}

export interface Ontology {
  id: string;
  name: string;
  description: string;
  status: OntologyStatus;
  businessCase?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  blobUri?: string;
  artifactFiles?: OntologyArtifactFile[];
  fabricArtifactId?: string;
  entities: OntologyEntity[];
  relationships?: OntologyRelationship[];
  bindings?: OntologyBinding[];
  history?: OntologyHistoryEntry[];
}
