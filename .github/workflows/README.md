# GitHub Actions — path-scoped deployments

Each workflow uses **include-only** `paths:` filters so it runs only when its own component
changes. Any change confined to `README.md`, `LICENSE`, `docs/**`, or files not listed below
will **not** trigger any workflow.

| Workflow | Triggers on changes under | Deploys to |
| --- | --- | --- |
| [deploy-infra.yml](deploy-infra.yml) | `infra/terraform/**`, `deploy-infra.yml` | Terraform-managed Azure infra (VNet, App Service, Key Vault, Cosmos, Storage, ACS, RBAC) |
| [deploy-api.yml](deploy-api.yml) | `api/**`, `deploy-api.yml` | `api-fabriciq-b3` App Service (private) |
| [deploy-ui.yml](deploy-ui.yml) | `ui/**`, `deploy-ui.yml` | `ui-fabriciq-b3` App Service (public) |
| [deploy-foundry-agents.yml](deploy-foundry-agents.yml) | `foundry/**`, `deploy-foundry-agents.yml` | Foundry project `proj-default` (Ontology Generator + Ontology Data Binder agents) |
| [deploy-fabric-ontology.yml](deploy-fabric-ontology.yml) | `fabric/**`, `deploy-fabric-ontology.yml` *(also `workflow_dispatch` / `repository_dispatch` from the UI/API)* | Fabric workspace `2b2c447d-86e1-4982-a5b6-09d2e0f3482d` (SQL views + ontology metadata) |
| [deploy-data-stores.yml](deploy-data-stores.yml) | `data-stores/**`, `deploy-data-stores.yml` | Cosmos DB containers + Blob containers + seed data |

## Authentication

All workflows authenticate to Azure with **OIDC federated credentials** (no client secrets).
Required GitHub repository secrets:

| Secret | Used by | Purpose |
| --- | --- | --- |
| `AZURE_CLIENT_ID` | all | Federated app registration's client ID |
| `AZURE_TENANT_ID` | all | `b158173c-91f6-4f99-b5e9-aa9bcb463863` |
| `AZURE_SUBSCRIPTION_ID` | all | `86b37969-9445-49cf-b03f-d8866235171c` |
| `TF_STATE_RESOURCE_GROUP` | infra | RG containing the Terraform state storage account |
| `TF_STATE_STORAGE_ACCOUNT` | infra | Storage account holding `tfstate` container |
| `TF_STATE_CONTAINER` | infra | Blob container name (e.g. `tfstate`) |
| `TF_STATE_KEY` | infra | Blob name (e.g. `fabriciq.tfstate`) |
| `ENTRA_CLIENT_ID` | infra | Entra app (client) ID consumed by the UI for Entra ID sign-in |
| `KEY_VAULT_NAME` | foundry-agents | Name of the Key Vault that stores Foundry agent IDs |
| `FOUNDRY_PROJECT_ENDPOINT` | foundry-agents | `https://002-ai-poc-private.services.ai.azure.com/api/projects/proj-default` |

## Trigger matrix

| Change set | infra | api | ui | foundry | fabric | data-stores |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| `README.md` / `docs/**` / `LICENSE` | — | — | — | — | — | — |
| `infra/terraform/**` | ✅ | — | — | — | — | — |
| `api/**` | — | ✅ | — | — | — | — |
| `ui/**` | — | — | ✅ | — | — | — |
| `foundry/**` | — | — | — | ✅ | — | — |
| `fabric/**` | — | — | — | — | ✅ | — |
| `data-stores/**` | — | — | — | — | — | ✅ |
| Multiple folders | ✅ for each affected component only |

## Triggering Fabric deployment from the UI/API

`deploy-fabric-ontology.yml` also accepts a `repository_dispatch` event of type
`deploy-ontology` with payload `{ "ontologyId": "<id>", "includeViews": true|false }`.
The API uses `POST /repos/{owner}/{repo}/dispatches` with a PAT or a Foundry-injected GitHub
App token to fire this off when an Admin approves a deployment from the UI.
