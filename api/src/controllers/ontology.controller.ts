import { Request, Response } from 'express';

import { CosmosService } from '../services/cosmos.service';
import { OntologyInput } from '../types/ontology.types';

const cosmosService = new CosmosService();

export class OntologyController {
  async list(_request: Request, response: Response): Promise<void> {
    const ontologies = await cosmosService.listOntologies();
    response.status(200).json(ontologies);
  }

  async getById(request: Request<{ id: string }>, response: Response): Promise<void> {
    const ontology = await cosmosService.getOntologyById(request.params.id);

    if (!ontology) {
      response.status(404).json({ message: 'Ontology not found.' });
      return;
    }

    response.status(200).json(ontology);
  }

  async create(request: Request<unknown, unknown, OntologyInput>, response: Response): Promise<void> {
    const ontology = await cosmosService.upsertOntology(request.body);
    response.status(201).json(ontology);
  }

  async update(request: Request<{ id: string }, unknown, OntologyInput>, response: Response): Promise<void> {
    const ontology = await cosmosService.upsertOntology({ ...request.body, id: request.params.id });
    response.status(200).json(ontology);
  }

  async remove(request: Request<{ id: string }>, response: Response): Promise<void> {
    const removed = await cosmosService.deleteOntology(request.params.id);
    response.status(removed ? 204 : 404).send(removed ? undefined : { message: 'Ontology not found.' });
  }
}
