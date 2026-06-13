import { environment } from '../config/environment';
import { Ontology } from '../types/ontology.types';

export interface FabricDeployRequest {
  ontology: Ontology;
  actorEmail: string;
  triggerSource: 'ui' | 'api' | 'workflow';
}

export interface FabricDeployResult {
  workspaceId: string;
  artifactId: string;
  status: 'submitted' | 'queued' | 'failed';
  triggeredAt: string;
  details?: string;
}

/**
 * Placeholder Fabric / OneLake deployment service.
 *
 * In a wired-up environment this would:
 *   1. Acquire a token for `https://api.fabric.microsoft.com/.default`
 *      via DefaultAzureCredential (managed identity in App Service).
 *   2. Call Microsoft Fabric REST APIs to publish ontology + views.
 *   3. Optionally dispatch a GitHub workflow (deploy-fabric-ontology) for
 *      git-backed Fabric workspaces.
 */
export class FabricDeployService {
  async deploy(request: FabricDeployRequest): Promise<FabricDeployResult> {
    if (!environment.fabricWorkspaceId) {
      throw new Error('FABRIC_WORKSPACE_ID is not configured.');
    }

    return {
      workspaceId: environment.fabricWorkspaceId,
      artifactId: request.ontology.fabricArtifactId ?? `ontology-${request.ontology.id}`,
      status: 'submitted',
      triggeredAt: new Date().toISOString(),
      details: `Submitted by ${request.actorEmail} from ${request.triggerSource}.`
    };
  }
}

export const fabricDeployService = new FabricDeployService();
