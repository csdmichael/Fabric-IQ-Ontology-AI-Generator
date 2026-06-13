import { Request, Response } from 'express';

import { BlobService } from '../services/blob.service';
import { cosmosService } from '../services/cosmos.service';
import { fabricDeployService } from '../services/fabric-deploy.service';
import { OntologyInput, OntologyStatus } from '../types/ontology.types';

const blobService = new BlobService();

const requireActor = (request: Request<unknown, unknown, unknown, unknown, Record<string, unknown>> | Request, response: Response): boolean => {
  if (!request.user) {
    response.status(401).json({ message: 'Authentication required.' });
    return false;
  }
  return true;
};

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
    if (!requireActor(request, response)) return;
    const ontology = await cosmosService.upsertOntology(request.body, request.user);
    response.status(201).json(ontology);
  }

  async update(request: Request<{ id: string }, unknown, OntologyInput>, response: Response): Promise<void> {
    if (!requireActor(request, response)) return;
    const ontology = await cosmosService.upsertOntology({ ...request.body, id: request.params.id }, request.user);
    response.status(200).json(ontology);
  }

  async remove(request: Request<{ id: string }>, response: Response): Promise<void> {
    if (!requireActor(request, response)) return;
    const removed = await cosmosService.deleteOntology(request.params.id);
    response.status(removed ? 204 : 404).send(removed ? undefined : { message: 'Ontology not found.' });
  }

  async submitForBinding(
    request: Request<{ id: string }, unknown, { note?: string }>,
    response: Response
  ): Promise<void> {
    if (!requireActor(request, response)) return;
    const updated = await cosmosService.applyAction(request.params.id, {
      actor: request.user!,
      action: 'submit-for-binding',
      status: 'awaiting_data_binding' as OntologyStatus,
      note: request.body?.note
    });
    if (!updated) {
      response.status(404).json({ message: 'Ontology not found.' });
      return;
    }
    response.status(200).json(updated);
  }

  async submitForDeployment(
    request: Request<{ id: string }, unknown, { note?: string }>,
    response: Response
  ): Promise<void> {
    if (!requireActor(request, response)) return;
    const updated = await cosmosService.applyAction(request.params.id, {
      actor: request.user!,
      action: 'submit-for-deployment',
      status: 'awaiting_deployment' as OntologyStatus,
      note: request.body?.note
    });
    if (!updated) {
      response.status(404).json({ message: 'Ontology not found.' });
      return;
    }

    // Persist the artifact to blob so the Fabric workflow can consume it.
    const artifact = await blobService.saveOntologyArtifact(updated.id, updated);
    const withBlob = await cosmosService.upsertOntology(
      { id: updated.id, blobUri: artifact.uri },
      request.user
    );

    response.status(200).json(withBlob);
  }

  async deployToFabric(
    request: Request<{ id: string }, unknown, { note?: string }>,
    response: Response
  ): Promise<void> {
    if (!requireActor(request, response)) return;
    const ontology = await cosmosService.getOntologyById(request.params.id);
    if (!ontology) {
      response.status(404).json({ message: 'Ontology not found.' });
      return;
    }

    await cosmosService.applyAction(ontology.id, {
      actor: request.user!,
      action: 'deploy-started',
      status: 'deploying',
      note: request.body?.note
    });

    try {
      const result = await fabricDeployService.deploy({
        ontology,
        actorEmail: request.user!.email,
        triggerSource: 'api'
      });
      const published = await cosmosService.applyAction(ontology.id, {
        actor: request.user!,
        action: 'deploy-completed',
        status: 'published',
        note: result.details
      });
      response.status(200).json({ ontology: published, fabric: result });
    } catch (error) {
      await cosmosService.applyAction(ontology.id, {
        actor: request.user!,
        action: 'deploy-failed',
        status: 'rejected',
        note: error instanceof Error ? error.message : String(error)
      });
      response.status(500).json({ message: error instanceof Error ? error.message : 'Fabric deployment failed.' });
    }
  }
}
