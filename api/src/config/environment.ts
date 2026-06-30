import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  cosmosEndpoint: string;
  cosmosKey: string;
  cosmosDatabase: string;
  cosmosContainer: string;
  cosmosUsersContainer: string;
  cosmosLoginAuditContainer: string;
  storageConnectionString: string;
  storageAccountName: string;
  storageContainer: string;
  storageOntologyContainer: string;
  fabricWorkspaceId: string;
  fabricCapacityId: string;
  fabricClientId: string;
  fabricClientSecret: string;
  fabricTenantId: string;
  fabricLakehouseId: string;
  openAiApiKey: string;
  azureOpenAiEndpoint: string;
  azureOpenAiKey: string;
  azureOpenAiDeployment: string;
  openAiTimeoutMs: number;
  corsOrigin: string;

  // Auth
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtTtlSeconds: number;
  otpTtlSeconds: number;
  otpLength: number;
  authAllowedEntraDomain: string;
  entraTenantId: string;
  entraClientId: string;
  entraIssuer: string;
  entraJwksUri: string;

  // Email (Azure Communication Services)
  acsConnectionString: string;
  acsSenderAddress: string;
  acsEndpoint: string;

  // Foundry agents
  foundryProjectEndpoint: string;
  foundryApiVersion: string;
  foundryOntologyGeneratorAgentId: string;
  foundryOntologyDataBinderAgentId: string;

  // APIM
  apimBaseUrl: string;
  apimSubscriptionKey: string;
}

const tenantId = process.env.AZURE_TENANT_ID ?? process.env.ENTRA_TENANT_ID ?? 'b158173c-91f6-4f99-b5e9-aa9bcb463863';

export const environment: AppConfig = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  cosmosEndpoint: process.env.COSMOS_ENDPOINT ?? '',
  cosmosKey: process.env.COSMOS_KEY ?? '',
  cosmosDatabase: process.env.COSMOS_DATABASE ?? 'fabric-iq',
  cosmosContainer: process.env.COSMOS_CONTAINER ?? 'ontologies',
  cosmosUsersContainer: process.env.COSMOS_USERS_CONTAINER ?? 'users',
  cosmosLoginAuditContainer: process.env.COSMOS_LOGIN_AUDIT_CONTAINER ?? 'login-audit',
  storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING ?? '',
  storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME ?? 'aistoragemyaacoub',
  storageContainer: process.env.AZURE_STORAGE_CONTAINER ?? 'fabric-iq-prompts',
  storageOntologyContainer: process.env.AZURE_STORAGE_ONTOLOGY_CONTAINER ?? 'fabric-ontologies',
  fabricWorkspaceId: process.env.FABRIC_WORKSPACE_ID ?? '2b2c447d-86e1-4982-a5b6-09d2e0f3482d',
  fabricCapacityId: process.env.FABRIC_CAPACITY_ID ?? '',
  fabricClientId: process.env.FABRIC_CLIENT_ID ?? '',
  fabricClientSecret: process.env.FABRIC_CLIENT_SECRET ?? '',
  fabricTenantId: process.env.FABRIC_TENANT_ID ?? tenantId,
  fabricLakehouseId: process.env.FABRIC_LAKEHOUSE_ID ?? '',
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT ?? '',
  azureOpenAiKey: process.env.AZURE_OPENAI_KEY ?? '',
  azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? 'fabric-iq-generator',
  openAiTimeoutMs: Number(process.env.AZURE_OPENAI_TIMEOUT_MS ?? 90000),
  corsOrigin:
    process.env.CORS_ORIGIN ??
    'http://localhost:4200,https://ui-fabriciq-b3.azurewebsites.net',

  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtIssuer: process.env.JWT_ISSUER ?? 'fabric-iq-api',
  jwtAudience: process.env.JWT_AUDIENCE ?? 'fabric-iq-ui',
  jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS ?? 8 * 60 * 60),
  otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 10 * 60),
  otpLength: Number(process.env.OTP_LENGTH ?? 6),
  authAllowedEntraDomain: (process.env.AUTH_ALLOWED_ENTRA_DOMAIN ?? '@mngenvmcap829495.onmicrosoft.com').toLowerCase(),
  entraTenantId: tenantId,
  entraClientId: process.env.ENTRA_CLIENT_ID ?? '',
  entraIssuer: process.env.ENTRA_ISSUER ?? `https://login.microsoftonline.com/${tenantId}/v2.0`,
  entraJwksUri: process.env.ENTRA_JWKS_URI ?? `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,

  acsConnectionString: process.env.ACS_CONNECTION_STRING ?? '',
  acsSenderAddress: process.env.ACS_SENDER_ADDRESS ?? 'DoNotReply@fabriciq-shortages-email-b3.azurecomm.net',
  acsEndpoint: process.env.ACS_ENDPOINT ?? '',

  foundryProjectEndpoint: process.env.FOUNDRY_PROJECT_ENDPOINT ?? 'https://002-ai-poc-private.services.ai.azure.com/api/projects/proj-default',
  foundryApiVersion: process.env.FOUNDRY_API_VERSION ?? '2025-05-01',
  foundryOntologyGeneratorAgentId: process.env.FOUNDRY_ONTOLOGY_GENERATOR_AGENT_ID ?? '',
  foundryOntologyDataBinderAgentId: process.env.FOUNDRY_ONTOLOGY_DATA_BINDER_AGENT_ID ?? '',

  apimBaseUrl: process.env.APIM_BASE_URL ?? '',
  apimSubscriptionKey: process.env.APIM_SUBSCRIPTION_KEY ?? ''
};
