export interface StoredPrompt {
  id: string;
  content: string;
  createdAt: string;
}

export interface StoredOntologyArtifact {
  id: string;
  ontologyId: string;
  blobName: string;
  uri: string;
  savedAt: string;
}

export interface StoredOntologyPackage {
  ontologyId: string;
  savedAt: string;
  files: Array<{
    type: 'ttl' | 'entities-json' | 'relationships-json' | 'bindings-json';
    blobName: string;
    uri: string;
    content: string;
  }>;
}

/**
 * In-memory placeholder for prompt + ontology artifact storage. In Azure, the
 * payloads land in the `fabric-iq-prompts` and `fabric-ontologies` containers
 * inside the `aistoragemyaacoub` storage account, accessed via private endpoint.
 */
export class BlobService {
  private readonly prompts = new Map<string, StoredPrompt>();
  private readonly ontologies = new Map<string, StoredOntologyArtifact>();
  private readonly packages = new Map<string, StoredOntologyPackage>();

  async savePrompt(id: string, content: string): Promise<StoredPrompt> {
    const prompt: StoredPrompt = {
      id,
      content,
      createdAt: new Date().toISOString()
    };

    this.prompts.set(id, prompt);
    return prompt;
  }

  async getPrompt(id: string): Promise<StoredPrompt | undefined> {
    return this.prompts.get(id);
  }

  async saveOntologyArtifact(ontologyId: string, payload: unknown): Promise<StoredOntologyArtifact> {
    const blobName = `ontologies/${ontologyId}/ontology.json`;
    const artifact: StoredOntologyArtifact = {
      id: `${ontologyId}-${Date.now()}`,
      ontologyId,
      blobName,
      uri: `blob://fabric-ontologies/${blobName}`,
      savedAt: new Date().toISOString()
    };
    this.ontologies.set(ontologyId, artifact);
    // Real Azure SDK call would happen here:
    //   blobServiceClient.getContainerClient('fabric-ontologies').getBlockBlobClient(blobName)
    //     .upload(JSON.stringify(payload), Buffer.byteLength(JSON.stringify(payload)));
    void payload;
    return artifact;
  }

  async saveOntologyPackage(
    ontologyId: string,
    payload: {
      name: string;
      entities?: Array<{ id: string; name: string; description?: string; properties?: Array<{ id: string; name: string; type: string; description?: string }> }>;
      relationships?: Array<{ id: string; name: string; fromEntityId: string; toEntityId: string; cardinality?: string; description?: string }>;
      bindings?: Array<{ id: string; entityId: string; propertyId?: string; lakehouseTable: string; lakehouseView?: string; sourceField: string; notes?: string }>;
    }
  ): Promise<StoredOntologyPackage> {
    const savedAt = new Date().toISOString();
    const base = `ontologies/${ontologyId}`;
    const ttl = this.toTurtle(payload);

    const files: StoredOntologyPackage['files'] = [
      {
        type: 'ttl',
        blobName: `${base}/ontology.ttl`,
        uri: `blob://fabric-ontologies/${base}/ontology.ttl`,
        content: ttl
      },
      {
        type: 'entities-json',
        blobName: `${base}/entities.json`,
        uri: `blob://fabric-ontologies/${base}/entities.json`,
        content: JSON.stringify(payload.entities ?? [], null, 2)
      },
      {
        type: 'relationships-json',
        blobName: `${base}/relationships.json`,
        uri: `blob://fabric-ontologies/${base}/relationships.json`,
        content: JSON.stringify(payload.relationships ?? [], null, 2)
      },
      {
        type: 'bindings-json',
        blobName: `${base}/bindings.json`,
        uri: `blob://fabric-ontologies/${base}/bindings.json`,
        content: JSON.stringify(payload.bindings ?? [], null, 2)
      }
    ];

    const pack: StoredOntologyPackage = {
      ontologyId,
      savedAt,
      files
    };
    this.packages.set(ontologyId, pack);
    return pack;
  }

  async getOntologyPackage(ontologyId: string): Promise<StoredOntologyPackage | undefined> {
    return this.packages.get(ontologyId);
  }

  private toTurtle(payload: {
    name: string;
    entities?: Array<{ id: string; name: string; properties?: Array<{ name: string; type: string }> }>;
    relationships?: Array<{ id: string; name: string; fromEntityId: string; toEntityId: string; cardinality?: string }>;
  }): string {
    const lines: string[] = [
      '@prefix onto: <https://fabric-iq.local/ontology#> .',
      '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .',
      '',
      `onto:Ontology a onto:DomainOntology ;`,
      `  onto:name "${payload.name.replace(/"/g, "'")}" .`,
      ''
    ];

    for (const entity of payload.entities ?? []) {
      lines.push(`onto:${entity.id} a onto:Entity ;`);
      lines.push(`  onto:label "${entity.name.replace(/"/g, "'")}" .`);
      for (const property of entity.properties ?? []) {
        lines.push(`onto:${entity.id}_${property.name} a onto:Property ;`);
        lines.push(`  onto:belongsTo onto:${entity.id} ;`);
        lines.push(`  onto:dataType "${property.type}" .`);
      }
      lines.push('');
    }

    for (const relationship of payload.relationships ?? []) {
      lines.push(`onto:${relationship.id} a onto:Relationship ;`);
      lines.push(`  onto:label "${relationship.name.replace(/"/g, "'")}" ;`);
      lines.push(`  onto:from onto:${relationship.fromEntityId} ;`);
      lines.push(`  onto:to onto:${relationship.toEntityId} ;`);
      lines.push(`  onto:cardinality "${relationship.cardinality ?? 'unspecified'}" .`);
      lines.push('');
    }

    return lines.join('\n');
  }

  async getOntologyArtifact(ontologyId: string): Promise<StoredOntologyArtifact | undefined> {
    return this.ontologies.get(ontologyId);
  }
}
