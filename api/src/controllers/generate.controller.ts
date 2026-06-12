import { Request, Response } from 'express';

import { BlobService } from '../services/blob.service';
import { OpenAiService } from '../services/openai.service';

interface GenerateRequestBody {
  businessCase?: string;
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

    response.status(200).json(result);
  }
}
