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
  properties: OntologyProperty[];
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
  history?: OntologyHistoryEntry[];
  createdBy?: string;
  lastModifiedBy?: string;
  blobUri?: string;
  fabricArtifactId?: string;
}

export type OntologyInput = Partial<Omit<Ontology, 'id' | 'createdAt' | 'updatedAt'>> & {
  id?: string;
  name?: string;
  description?: string;
  entities?: OntologyEntity[];
  relationships?: OntologyRelationship[];
};
