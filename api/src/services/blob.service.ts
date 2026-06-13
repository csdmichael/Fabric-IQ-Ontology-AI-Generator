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

/**
 * In-memory placeholder for prompt + ontology artifact storage. In Azure, the
 * payloads land in the `fabric-iq-prompts` and `fabric-ontologies` containers
 * inside the `aistoragemyaacoub` storage account, accessed via private endpoint.
 */
export class BlobService {
  private readonly prompts = new Map<string, StoredPrompt>();
  private readonly ontologies = new Map<string, StoredOntologyArtifact>();

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

  async getOntologyArtifact(ontologyId: string): Promise<StoredOntologyArtifact | undefined> {
    return this.ontologies.get(ontologyId);
  }
}
