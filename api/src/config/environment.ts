import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  cosmosEndpoint: string;
  cosmosKey: string;
  cosmosDatabase: string;
  cosmosContainer: string;
  storageConnectionString: string;
  storageContainer: string;
  fabricWorkspaceId: string;
  fabricCapacityId: string;
  fabricClientId: string;
  fabricClientSecret: string;
  fabricTenantId: string;
  openAiApiKey: string;
  azureOpenAiEndpoint: string;
  azureOpenAiKey: string;
  azureOpenAiDeployment: string;
  corsOrigin: string;
}

export const environment: AppConfig = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  cosmosEndpoint: process.env.COSMOS_ENDPOINT ?? '',
  cosmosKey: process.env.COSMOS_KEY ?? '',
  cosmosDatabase: process.env.COSMOS_DATABASE ?? 'fabric-iq',
  cosmosContainer: process.env.COSMOS_CONTAINER ?? 'ontologies',
  storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING ?? '',
  storageContainer: process.env.AZURE_STORAGE_CONTAINER ?? 'fabric-iq-prompts',
  fabricWorkspaceId: process.env.FABRIC_WORKSPACE_ID ?? '',
  fabricCapacityId: process.env.FABRIC_CAPACITY_ID ?? '',
  fabricClientId: process.env.FABRIC_CLIENT_ID ?? '',
  fabricClientSecret: process.env.FABRIC_CLIENT_SECRET ?? '',
  fabricTenantId: process.env.FABRIC_TENANT_ID ?? '',
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT ?? '',
  azureOpenAiKey: process.env.AZURE_OPENAI_KEY ?? '',
  azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? 'fabric-iq-generator',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200'
};
