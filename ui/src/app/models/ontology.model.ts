export interface OntologyProperty {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'reference';
  sourceColumn?: string;
  description?: string;
}

export interface OntologyEntity {
  id: string;
  name: string;
  description: string;
  sourceTable?: string;
  properties: OntologyProperty[];
}

export interface Ontology {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'generated' | 'published';
  businessCase?: string;
  createdAt: string;
  updatedAt: string;
  entities: OntologyEntity[];
}
