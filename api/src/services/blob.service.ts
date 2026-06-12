export interface StoredPrompt {
  id: string;
  content: string;
  createdAt: string;
}

export class BlobService {
  private readonly prompts = new Map<string, StoredPrompt>();

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
}
