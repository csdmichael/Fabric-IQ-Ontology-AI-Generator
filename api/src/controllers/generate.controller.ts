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

    const result = await openAiService.generateOntologyDraft(businessCase);
    await blobService.savePrompt(result.ontology.id, businessCase);

    // Persist the generated draft so the rest of the workflow (binding / deployment) can take over.
    if (request.body.persist !== false && request.user) {
      const persisted = await cosmosService.upsertOntology(
        {
          id: result.ontology.id,
          name: result.ontology.name,
          description: result.ontology.description,
          status: result.ontology.status,
          businessCase: result.ontology.businessCase,
          entities: result.ontology.entities
        },
        request.user
      );
      result.ontology = persisted;
    }

    response.status(200).json(result);
  }
}
