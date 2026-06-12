export type OntologyStatus = 'draft' | 'generated' | 'published';
export type OntologyPropertyType = 'string' | 'number' | 'boolean' | 'date' | 'reference';

export interface OntologyProperty {
  id: string;
  name: string;
  type: OntologyPropertyType;
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
  status: OntologyStatus;
  businessCase?: string;
  createdAt: string;
  updatedAt: string;
  entities: OntologyEntity[];
}

export type OntologyInput = Partial<Omit<Ontology, 'id' | 'createdAt' | 'updatedAt'>> & {
  id?: string;
  name?: string;
  description?: string;
  entities?: OntologyEntity[];
};
