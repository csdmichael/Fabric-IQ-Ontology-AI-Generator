# Fabric IQ — Terraform infrastructure

End-to-end Terraform module that provisions the Fabric IQ Ontology AI Generator into resource
group **`ai-myaacoub`** (subscription `86b37969-9445-49cf-b03f-d8866235171c`). All non-UI
services are private — only the Angular UI App Service is reachable from the public internet.

## Resources

| Layer | Resources |
| --- | --- |
| Networking | `vnet-fabriciq`, subnets `snet-app` (App Service VNet integration, `Microsoft.Web/serverFarms` delegation), `snet-pe` (private endpoints), `snet-apim` (APIM stv2) |
| Compute | App Service Plan `plan-fabriciq-b3` (P1v3 Linux), Web Apps `api-fabriciq-b3` + `ui-fabriciq-b3` |
| Identity | User-assigned managed identity `id-fabriciq` shared by both web apps |
| Secrets | Key Vault `kv-fabriciq` (purge-protection on, RBAC) with secrets JWT_SECRET, ENTRA_CLIENT_ID, ACS_CONNECTION_STRING, FOUNDRY_PROJECT_ENDPOINT, FOUNDRY_AGENT_ONTOLOGY_GENERATOR_ID, FOUNDRY_AGENT_ONTOLOGY_DATA_BINDER_ID, FABRIC_WORKSPACE_ID |
| Data | Cosmos account `cosmos-fabriciq-demo-01` (DB `fabriciq`, containers `users`, `ontologies`, `audit`), Storage `aistoragemyaacoub` (container `fabric-ontologies`) |
| Messaging | Azure Communication Services `fabriciq-shortages-email-b3` + email domain `fabriciq-shortages-email-b3.azurecomm.net` (DoNotReply sender) |
| AI Gateway | API Management `ai-gateway-apim-poc-my` (Developer tier, stv2, internal VNet) — referenced as existing |
| Foundry | AI Services + project `002-ai-poc-private` / `proj-default` — referenced as existing |
| Private DNS | Private DNS zones + zone group links for KV, Cosmos, Storage (blob), ACS, Web Apps, OpenAI |

## State backend

Default backend is **azurerm** (storage account passed at `terraform init` time). Override in
`backend.tfvars` (see `backend.example.tfvars`).

## Usage

```powershell
cd infra/terraform

# 1) Authenticate
az login --tenant b158173c-91f6-4f99-b5e9-aa9bcb463863
az account set --subscription 86b37969-9445-49cf-b03f-d8866235171c

# 2) Init with remote state
terraform init -backend-config="backend.tfvars"

# 3) Plan
terraform plan -var-file="dev.tfvars" -out tfplan

# 4) Apply
terraform apply tfplan
```

## CI/CD (GitHub Actions, OIDC)

`.github/workflows/deploy-infra.yml` runs `terraform init` → `plan` → `apply` against this
folder using federated credentials (no client secrets). Required repo secrets:

- `AZURE_CLIENT_ID` — federated app registration
- `AZURE_TENANT_ID` — `b158173c-91f6-4f99-b5e9-aa9bcb463863`
- `AZURE_SUBSCRIPTION_ID` — `86b37969-9445-49cf-b03f-d8866235171c`
- `TF_STATE_RESOURCE_GROUP` — RG holding the state storage account
- `TF_STATE_STORAGE_ACCOUNT` — state storage account name
- `TF_STATE_CONTAINER` — blob container (e.g. `tfstate`)
- `TF_STATE_KEY` — blob name (e.g. `fabriciq.tfstate`)
