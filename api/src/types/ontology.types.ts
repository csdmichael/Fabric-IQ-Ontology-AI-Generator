export type OntologyStatus =
  | 'draft'
  | 'generated'
  | 'awaiting_data_binding'
  | 'binding_in_progress'
  | 'awaiting_deployment'
  | 'deploying'
  | 'published'
  | 'rejected';

export type OntologyPropertyType = 'string' | 'number' | 'boolean' | 'date' | 'reference';

export interface OntologyProperty {
  id: string;
  name: string;
  type: OntologyPropertyType;
  sourceTable?: string;
  sourceView?: string;
  sourceColumn?: string;
  description?: string;
}

export interface OntologyRelationship {
  id: string;
  name: string;
  fromEntityId: string;
  toEntityId: string;
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-many';
  description?: string;
}

export interface OntologyEntity {
  id: string;
  name: string;
  description: string;
  sourceTable?: string;
  sourceView?: string;
  properties: OntologyProperty[];
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
  at: string;
  actor: string;
  role: string;
  action: string;
  note?: string;
}

export interface Ontology {
  id: string;
  name: string;
  description: string;
  status: OntologyStatus;
  businessCase?: string;
  createdAt: string;
  updatedAt: string;
  entities: OntologyEntity[];
  relationships?: OntologyRelationship[];
  bindings?: OntologyBinding[];
  history?: OntologyHistoryEntry[];
  createdBy?: string;
  lastModifiedBy?: string;
  blobUri?: string;
  artifactFiles?: OntologyArtifactFile[];
  fabricArtifactId?: string;
}

export type OntologyInput = Partial<Omit<Ontology, 'id' | 'createdAt' | 'updatedAt'>> & {
  id?: string;
  name?: string;
  description?: string;
  entities?: OntologyEntity[];
  relationships?: OntologyRelationship[];
};
