# Fabric IQ Ontology AI Generator

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [UI Setup](#ui-setup)
  - [API Setup](#api-setup)
- [Development](#development)
- [Environment Variables](#environment-variables)
- [License](#license)

## Overview

Fabric IQ Ontology AI Generator helps business teams describe a business case in plain English, connect to Microsoft Fabric and OneLake, and generate a draft ontology with business entities and properties. The scaffold includes an Angular + Ionic frontend, a Node/Express API, placeholder Azure service integrations, and starter tests.

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

## License

This project is licensed under the [MIT License](LICENSE).
