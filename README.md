# Fabric IQ Ontology AI Generator

## Table of Contents
- [Overview](#overview)
- [Deployed Endpoints](#deployed-endpoints)
- [Features](#features)
- [Architecture](#architecture)
- [Authentication & Roles](#authentication--roles)
- [Foundry Agents](#foundry-agents)
- [Getting Started](#getting-started)
  - [UI Setup](#ui-setup)
  - [API Setup](#api-setup)
  - [API Documentation (Swagger)](#api-documentation-swagger)
- [Development](#development)
- [Environment Variables](#environment-variables)
- [CI/CD & GitHub Workflows](#cicd--github-workflows)
- [License](#license)

## Overview

Fabric IQ Ontology AI Generator helps business teams describe a business case in plain English, connect to Microsoft Fabric and OneLake, and generate a draft ontology with business entities and properties. The scaffold includes an Angular + Ionic frontend, a Node/Express API, placeholder Azure service integrations, and starter tests.

## Deployed Endpoints

| Component | URL |
| --- | --- |
| UI (public) | https://ui-fabriciq-b3.azurewebsites.net |
| API (VNet-integrated, called from UI) | https://api-fabriciq-b3.azurewebsites.net |
| API — Swagger UI | https://api-fabriciq-b3.azurewebsites.net/api/docs |
| API — OpenAPI spec (JSON) | https://api-fabriciq-b3.azurewebsites.net/api/openapi.json |
| API — Health probe | https://api-fabriciq-b3.azurewebsites.net/api/health |

> The API runs in the VNet behind a private endpoint. Swagger UI is reachable from the public UI App Service via VNet integration; direct browser access from the internet is intentionally blocked. To explore the API interactively, sign in to the UI and open the **System Documentation → API Reference** link, or run `npm run start:api` locally and visit http://localhost:3000/api/docs.

## Features

- Angular 17 + Ionic 7 standalone UI scaffold
- Ontology dashboard, list, editor, generation, and settings screens
- Reusable ontology card, entity list, and visualization shell components
- Node.js + TypeScript API for ontology CRUD, datasource config, generation, and health
- Placeholder integrations for Cosmos DB, Blob Storage, Fabric / OneLake, and OpenAI / Azure OpenAI
- Environment-driven configuration for local development and deployment
- Workspace scripts for running UI and API together
- Starter Jasmine/Karma and Jest/Supertest tests

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full overview.

```text
UI (Angular + Ionic)
  -> API (Node + Express)
    -> Cosmos DB
    -> Blob Storage
    -> Fabric / OneLake
    -> Azure OpenAI / OpenAI
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Chromium-based browser for Karma tests

### UI Setup

```bash
npm install
npm run start:ui
```

The UI runs with Angular CLI and expects the API at `http://localhost:3000` by default.

### API Setup

```bash
cp api/.env.example api/.env
npm install
npm run start:api
```

The API runs on port `3000` by default.

### API Documentation (Swagger)

The API ships with a built-in OpenAPI 3.0 spec and Swagger UI for interactive exploration:

| Endpoint | Description |
| --- | --- |
| `GET /api/docs` | Swagger UI (interactive — supports Bearer JWT) |
| `GET /api/openapi.json` | Raw OpenAPI 3.0 spec (machine-readable) |
| `GET /api/health` | Liveness probe |

To explore locally:

1. `npm run start:api`
2. Open http://localhost:3000/api/docs
3. Click **Authorize**, paste a JWT obtained from `POST /api/auth/otp/verify` or `POST /api/auth/entra/login`, then "Try it out" on any secured endpoint.

The Swagger spec covers Auth, Users, Ontologies (incl. workflow transitions), Datasources, Generate, and Foundry Agents.

## Authentication & Roles

The API enforces JWT-based authentication. Two sign-in methods are supported:

- **Microsoft Entra ID** — for `@MngEnvMCAP829495.onmicrosoft.com` accounts. The UI uses MSAL to obtain an `id_token` and exchanges it via `POST /api/auth/entra/login`.
- **One-time passcode (OTP)** — for external accounts (e.g. `myaacoub@microsoft.com`). The flow is `POST /api/auth/otp/request` → email delivered via Azure Communication Services → `POST /api/auth/otp/verify`.

Roles (enforced per-route via `requirePermission`):

| Role | Permissions |
| --- | --- |
| Business User | Create / edit / submit ontology drafts; chat with Ontology Generator agent |
| IT User | Configure Fabric lakehouse; bind ontology entities to OneLake tables; chat with Ontology Data Binder agent |
| Admin | All business + IT permissions; trigger Fabric ontology deployment |
| App Owner | All Admin permissions; manage users (create/edit/remove + set auth method) |

Seed App Owners:

- `admin@MngEnvMCAP829495.onmicrosoft.com` (Entra)
- `myaacoub@MngEnvMCAP829495.onmicrosoft.com` (Entra)
- `myaacoub@microsoft.com` (OTP)

## Foundry Agents

Two Microsoft Foundry agents are wired into the UI side-menu:

| Agent | Used by | UI surface |
| --- | --- | --- |
| `ontology-generator` | Business User | Business Ontology Builder → Generate / Editor |
| `ontology-data-binder` | IT User | IT Ontology Data Integration → Editor |

Agent IDs are written to Key Vault (`FOUNDRY-AGENT-ONTOLOGY-GENERATOR-ID`, `FOUNDRY-AGENT-ONTOLOGY-DATA-BINDER-ID`) by the `deploy-foundry-agents` workflow and surfaced to the API at runtime.

## Development

Run both apps together from the repository root:

```bash
npm install
npm start
```

Other useful commands:

```bash
npm run build
npm run test
```

## Environment Variables

Copy `api/.env.example` to `api/.env` and supply values for your environment.

| Variable | Description |
| --- | --- |
| `PORT` | API port |
| `NODE_ENV` | Runtime environment |
| `COSMOS_ENDPOINT` | Azure Cosmos DB endpoint |
| `COSMOS_KEY` | Azure Cosmos DB key |
| `COSMOS_DATABASE` | Cosmos database name |
| `COSMOS_CONTAINER` | Cosmos container name |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection string |
| `AZURE_STORAGE_CONTAINER` | Blob storage container name |
| `FABRIC_WORKSPACE_ID` | Microsoft Fabric workspace ID |
| `FABRIC_CAPACITY_ID` | Microsoft Fabric capacity ID |
| `FABRIC_CLIENT_ID` | Fabric app registration client ID |
| `FABRIC_CLIENT_SECRET` | Fabric app registration client secret |
| `FABRIC_TENANT_ID` | Azure tenant ID |
| `OPENAI_API_KEY` | OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint |
| `AZURE_OPENAI_KEY` | Azure OpenAI key |
| `AZURE_OPENAI_DEPLOYMENT` | Azure OpenAI deployment name |
| `CORS_ORIGIN` | Allowed CORS origin(s) |

## CI/CD & GitHub Workflows

GitHub Actions deploy each component on a path-scoped trigger so unrelated changes never re-deploy. See [.github/workflows/README.md](.github/workflows/README.md) for the full trigger matrix and the list of required secrets.

| Workflow | Triggers on changes to |
| --- | --- |
| `deploy-infra` | `infra/terraform/**` |
| `deploy-api` | `api/**` |
| `deploy-ui` | `ui/**` |
| `deploy-foundry-agents` | `foundry/**` |
| `deploy-fabric-ontology` | `fabric/**` or `repository_dispatch: deploy-ontology` (fired by UI/API) |
| `deploy-data-stores` | `data-stores/**` |

Documentation-only edits (`README.md`, `docs/**`, `LICENSE`) never trigger a workflow.

## License

This project is licensed under the [MIT License](LICENSE).
