import { Request, Response } from 'express';

import { BlobService } from '../services/blob.service';
import { cosmosService } from '../services/cosmos.service';
import { fabricDeployService } from '../services/fabric-deploy.service';
import { FabricService } from '../services/fabric.service';
import { foundryAgentService } from '../services/foundry-agent.service';
import { OntologyBinding, OntologyEntity, OntologyInput, OntologyStatus } from '../types/ontology.types';

const blobService = new BlobService();
const fabricService = new FabricService();

const requireActor = (request: Request<unknown, unknown, unknown, unknown, Record<string, unknown>> | Request, response: Response): boolean => {
  if (!request.user) {
    response.status(401).json({ message: 'Authentication required.' });
    return false;
  }
  return true;
};

const toSnakeField = (name: string): string =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/(^_|_$)/g, '')
    .toLowerCase() || 'id';

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

  /**
   * Runs the IT "Ontology Data Binder" agent to auto-map every entity and
   * property of an ontology to tables/fields of a selected Fabric connection.
   * Persists the generated bindings + source columns and returns the updated
   * ontology together with the agent's natural-language summary.
   */
  async autoBind(
    request: Request<{ id: string }, unknown, { connectionId?: string; guidance?: string }>,
    response: Response
  ): Promise<void> {
    if (!requireActor(request, response)) return;

    const ontology = await cosmosService.getOntologyById(request.params.id);
    if (!ontology) {
      response.status(404).json({ message: 'Ontology not found.' });
      return;
    }

    const { connectionId, guidance } = request.body ?? {};
    if (!connectionId) {
      response.status(400).json({ message: 'connectionId is required.' });
      return;
    }

    const connection = await fabricService.getDataSourceById(connectionId);
    if (!connection) {
      response.status(400).json({ message: `Connection ${connectionId} not found.` });
      return;
    }

    const isView = connection.type === 'view';
    const target = connection.itemName;

    const entities: OntologyEntity[] = ontology.entities.map((entity) => ({
      ...entity,
      sourceTable: isView ? entity.sourceTable : target,
      sourceView: isView ? target : entity.sourceView,
      properties: entity.properties.map((property) => ({
        ...property,
        sourceColumn: property.sourceColumn || toSnakeField(property.name),
        sourceTable: isView ? property.sourceTable : target,
        sourceView: isView ? target : property.sourceView
      }))
    }));

    const bindings: OntologyBinding[] = [];
    for (const entity of entities) {
      bindings.push({
        id: `bind-${entity.id}`,
        entityId: entity.id,
        lakehouseTable: isView ? '' : target,
        lakehouseView: isView ? target : undefined,
        sourceField: entity.properties[0]?.sourceColumn || 'id',
        notes: `Auto-mapped to ${connection.name} (${connection.type}) by the IT data binder.`
      });
      for (const property of entity.properties) {
        bindings.push({
          id: `bind-${entity.id}-${property.id}`,
          entityId: entity.id,
          propertyId: property.id,
          lakehouseTable: isView ? '' : target,
          lakehouseView: isView ? target : undefined,
          sourceField: property.sourceColumn || toSnakeField(property.name)
        });
      }
    }

    let agentReply = '';
    let agentDelivered = false;
    try {
      const agentResult = await foundryAgentService.chat({
        agentKey: 'ontology-data-binder',
        message: [
          `Map the ontology "${ontology.name}" to the Fabric ${connection.type} "${target}" in workspace ${connection.workspaceId}.`,
          `Entities: ${entities.map((entity) => `${entity.name} (${entity.properties.length} properties)`).join(', ') || 'none'}.`,
          guidance ? `Additional guidance: ${guidance}` : 'Use sensible column name conventions (snake_case).'
        ].join('\n'),
        context: { ontologyId: ontology.id, connectionId, guidance }
      });
      agentReply = agentResult.reply;
      agentDelivered = agentResult.delivered;
    } catch (error) {
      agentReply = `Deterministic mapping applied. Agent summary unavailable: ${error instanceof Error ? error.message : String(error)}`;
    }

    const updated = await cosmosService.upsertOntology(
      { id: ontology.id, entities, bindings, status: 'binding_in_progress' as OntologyStatus },
      request.user
    );
    await cosmosService.applyAction(ontology.id, {
      actor: request.user!,
      action: 'auto-bind',
      status: 'binding_in_progress',
      note: `Bound to ${connection.name}${guidance ? ` (guidance: ${guidance})` : ''}.`
    });

    response.status(200).json({
      ontology: updated,
      connection,
      agent: { key: 'ontology-data-binder', reply: agentReply, delivered: agentDelivered }
    });
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

    // Persist deployable ontology package artifacts to blob for admin deployment.
    const packageResult = await blobService.saveOntologyPackage(updated.id, {
      name: updated.name,
      entities: updated.entities,
      relationships: updated.relationships,
      bindings: updated.bindings
    });

    const artifact = await blobService.saveOntologyArtifact(updated.id, updated);
    const withBlob = await cosmosService.upsertOntology(
      {
        id: updated.id,
        blobUri: artifact.uri,
        artifactFiles: packageResult.files.map((file) => ({
          type: file.type,
          blobName: file.blobName,
          uri: file.uri
        }))
      },
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
