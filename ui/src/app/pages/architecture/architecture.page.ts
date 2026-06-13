import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonNote
} from '@ionic/angular/standalone';

interface DocSection {
  title: string;
  intro: string;
  bullets: string[];
}

@Component({
  selector: 'app-architecture-page',
  standalone: true,
  templateUrl: './architecture.page.html',
  imports: [
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonNote
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchitecturePage {
  protected readonly subtitle =
    'End-to-end view of how Fabric IQ generates, binds, and deploys business ontologies on top of Microsoft Fabric.';

  protected readonly sections: DocSection[] = [
    {
      title: '1. Personas & responsibilities',
      intro: 'Four personas collaborate through the same UI but see role-scoped sections:',
      bullets: [
        'Business user — drafts ontologies in the Business Ontology Builder, chats with the ontology-generator agent, exports to Word.',
        'IT user — opens IT Ontology Data Integration, binds entities/properties to Fabric tables/views via the ontology-data-binder agent, validates schemas.',
        'Admin — reviews, approves, and deploys finalized ontologies to Microsoft Fabric.',
        'App owner — manages users, roles, datasources, and the System Documentation section.'
      ]
    },
    {
      title: '2. Frontend (Angular + Ionic)',
      intro: 'Single-page Angular 17 standalone app with Ionic components, served by the API host.',
      bullets: [
        'Side menu organized in three sections: Business Ontology Builder, IT Ontology Data Integration, System Documentation.',
        'AuthService chooses Microsoft Entra ID (MSAL popup) for internal accounts and email OTP for guests.',
        'A single Bearer JWT (issued by the API) is attached to every request via an HttpInterceptor.',
        'Routes are guarded by `authGuard` (presence) and `roleGuard` (role / permission scope).'
      ]
    },
    {
      title: '3. API (Node.js + Express + TypeScript)',
      intro: 'Stateless REST API exposing /api/auth, /api/users, /api/ontologies, /api/datasources, /api/generate, /api/agents.',
      bullets: [
        'OTP flow: hash + store in Cosmos with TTL; verify on submit, then issue an HS256 app JWT.',
        'Entra flow: validate the id_token signature against the tenant JWKS, then issue the same app JWT.',
        'Role / permission map enforced in middleware (`requireAuth`, `requirePermission`).',
        'Ontology workflow endpoints record an audit history entry on every state transition.'
      ]
    },
    {
      title: '4. Microsoft Foundry agents',
      intro: 'Two Foundry hosted agents drive the conversational experience.',
      bullets: [
        'ontology-generator — turns a business case into a draft ontology and refines it on user feedback.',
        'ontology-data-binder — proposes mappings between ontology properties and Fabric lakehouse columns.',
        'Agent threads are proxied through the API so the model key never reaches the browser.'
      ]
    },
    {
      title: '5. Data stores',
      intro: 'Persistence layer is split across three Azure services with private endpoints.',
      bullets: [
        'Cosmos DB (`fabric-iq` database) — ontologies, users, OTP store, audit history.',
        'Azure Blob Storage (`aistoragemyaacoub`) — prompt archive (`fabric-iq-prompts`) and ontology JSON snapshots (`fabric-ontologies`).',
        'Microsoft Fabric workspace — published ontologies materialize as Lakehouse + semantic-model artifacts.'
      ]
    },
    {
      title: '6. Networking & security',
      intro: 'Production deployment is fully private and managed-identity based.',
      bullets: [
        'VNet hub with private endpoints for Cosmos, Blob, Fabric, OpenAI, and Key Vault.',
        'API + UI App Services run in a regional VNet integration with system-assigned managed identities.',
        'Azure API Management acts as the AI gateway in front of Foundry / Azure OpenAI for quota, content safety, and audit.',
        'Key Vault stores secrets (JWT signing key, ACS connection string, Fabric SPN). App Services read them via Key Vault references.'
      ]
    },
    {
      title: '7. CI/CD (5 GitHub workflows)',
      intro: 'Each lifecycle concern owns its own workflow so changes ship independently.',
      bullets: [
        'deploy-api.yml — builds the Node.js API zip and OneDeploys it to `api-fabriciq-b3`.',
        'deploy-ui.yml — builds the Angular bundle and OneDeploys it to `ui-fabriciq-b3`.',
        'deploy-foundry.yml — synchronizes agent definitions under `foundry/` to Microsoft Foundry.',
        'deploy-fabric.yml — pushes Fabric notebooks, lakehouse definitions, and semantic model deltas.',
        'deploy-data-stores.yml — ensures Cosmos containers and Blob containers exist with the right indexing / RBAC.'
      ]
    }
  ];
}
