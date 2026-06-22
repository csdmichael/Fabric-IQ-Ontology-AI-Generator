import { Request, Response } from 'express';

import { BlobService } from '../services/blob.service';
import { cosmosService } from '../services/cosmos.service';
import { OpenAiService } from '../services/openai.service';

interface GenerateRequestBody {
  businessCase?: string;
  persist?: boolean;
}

const blobService = new BlobService();
const openAiService = new OpenAiService();

export class GenerateController {
  async createDraft(request: Request<unknown, unknown, GenerateRequestBody>, response: Response): Promise<void> {
    const businessCase = request.body.businessCase?.trim();

    if (!businessCase) {
      response.status(400).json({ message: 'businessCase is required.' });
      return;
    }

    // Fast path: generate ontology immediately and return to user
    const result = await openAiService.generateOntologyDraft(businessCase);

    // Return result immediately (do not wait for saves)
    response.status(200).json(result);

    // Background operations: save prompt and persist to Cosmos (fire-and-forget)
    // These operations don't block the user experience
    void (async () => {
      try {
        await Promise.all([
          blobService.savePrompt(result.ontology.id, businessCase),
          request.body.persist !== false && request.user
            ? cosmosService.upsertOntology(
                {
                  id: result.ontology.id,
                  name: result.ontology.name,
                  description: result.ontology.description,
                  status: result.ontology.status,
                  businessCase: result.ontology.businessCase,
                  entities: result.ontology.entities
                },
                request.user
              )
            : Promise.resolve()
        ]);
      } catch (error) {
        // Log background errors but don't block user
        console.error('Background persist error:', error);
      }
    })();
  }
}
