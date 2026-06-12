# Architecture

Fabric IQ Ontology AI Generator uses a decoupled frontend and API architecture so business users can generate and refine ontologies without dealing with backend infrastructure details.

## Overview

- **UI**: Angular 17 + Ionic 7 standalone app for dashboarding, generation flows, ontology editing, and connection settings.
- **API**: Node.js + Express + TypeScript service exposing REST endpoints for ontology CRUD, generation, datasource access, and health checks.
- **Platform Services**: Placeholder integrations for Azure Cosmos DB, Azure Blob Storage, Microsoft Fabric / OneLake, and OpenAI / Azure OpenAI.

## ASCII diagram

```text
+---------------------------------------------------------------+
|                      Business Users / Teams                    |
+-------------------------------+-------------------------------+
                                |
                                v
+---------------------------------------------------------------+
|                 UI: Angular 17 + Ionic 7                      |
|  - Dashboard                                                   |
|  - Ontology list + editor                                      |
|  - AI generation workflow                                      |
|  - Fabric/Azure settings                                       |
+-------------------------------+-------------------------------+
                                |
                                | HTTPS / JSON
                                v
+---------------------------------------------------------------+
|                API: Node.js + Express + TypeScript            |
|  - /api/health                                                 |
|  - /api/ontologies                                             |
|  - /api/datasources                                            |
|  - /api/generate                                               |
+-------------+------------------+------------------+-----------+
              |                  |                  |
              v                  v                  v
     +----------------+  +----------------+  +--------------------+
     | Azure Cosmos DB|  | Azure Blob     |  | Fabric / OneLake   |
     | Ontology store |  | Prompt storage |  | Tables / views     |
     +----------------+  +----------------+  +--------------------+
                                |
                                v
                      +------------------------+
                      | OpenAI / Azure OpenAI |
                      | Draft ontology agent  |
                      +------------------------+
```

## Runtime flow

1. The UI collects a business case and configuration metadata.
2. The API persists or retrieves ontology drafts and connection settings.
3. Generation requests are passed to the AI placeholder service.
4. Generated ontology drafts can be reviewed, edited, and later bound to Fabric sources.
