import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, cloudUploadOutline, documentTextOutline, refreshOutline, rocketOutline, trashOutline } from 'ionicons/icons';

import { AgentChatComponent } from '../../components/agent-chat/agent-chat.component';
import { EntityListComponent } from '../../components/entity-list/entity-list.component';
import { OntologyGraphComponent } from '../../components/ontology-graph/ontology-graph.component';
import { Ontology, OntologyBinding, OntologyEntity, OntologyRelationship } from '../../models/ontology.model';
import { AuthService } from '../../services/auth.service';
import { OntologyExportService } from '../../services/ontology-export.service';
import { OntologyService } from '../../services/ontology.service';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-ontology-editor-page',
  standalone: true,
  templateUrl: './ontology-editor.page.html',
  imports: [
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonList,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonText,
    IonNote,
    EntityListComponent,
    OntologyGraphComponent,
    AgentChatComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ontologyService = inject(OntologyService);
  private readonly workflow = inject(WorkflowService);
  private readonly exporter = inject(OntologyExportService);
  private readonly auth = inject(AuthService);

  protected ontology: Ontology = this.createEmptyOntology();
  protected statusMessage = 'Draft ontology with business entities first. Fabric bindings are added later by IT.';
  protected readonly selectedEntityId = signal<string | undefined>(undefined);
  protected readonly busy = signal(false);
  protected readonly canGenerator = computed(() => this.auth.hasPermission('agent:ontology-generator'));
  protected readonly canBinder = computed(() => this.auth.hasPermission('agent:ontology-data-binder'));
  protected readonly canSubmitBinding = computed(() => this.auth.hasPermission('ontology:submit-for-binding'));
  protected readonly canSubmitDeployment = computed(() => this.auth.hasPermission('ontology:submit-for-deployment'));
  protected readonly canDeploy = computed(() => this.auth.hasPermission('ontology:deploy-to-fabric'));
  protected readonly isItUser = computed(() => this.auth.hasPermission('ontology:bind-data'));

  protected relationshipDraft: Pick<OntologyRelationship, 'name' | 'fromEntityId' | 'toEntityId' | 'cardinality' | 'description'> = {
    name: '',
    fromEntityId: '',
    toEntityId: '',
    cardinality: 'one-to-many',
    description: ''
  };

  protected bindingDraft: Omit<OntologyBinding, 'id'> = {
    entityId: '',
    propertyId: '',
    lakehouseTable: '',
    lakehouseView: '',
    sourceField: '',
    notes: ''
  };

  protected readonly agentContext = computed(() => ({
    ontologyId: this.ontology.id,
    ontology: this.ontology,
    selectedEntityId: this.selectedEntityId()
  }));

  constructor() {
    addIcons({ addOutline, cloudUploadOutline, rocketOutline, documentTextOutline, refreshOutline, trashOutline });
  }

  ngOnInit(): void {
    const stateOntology = history.state.ontology as Ontology | undefined;
    const ontologyId = this.route.snapshot.paramMap.get('id');

    if (stateOntology) {
      this.ontology = stateOntology;
      this.ensureEditorSelections();
      return;
    }

    if (!ontologyId || ontologyId === 'new') {
      return;
    }

    this.ontologyService.getOntology(ontologyId).subscribe({
      next: (ontology) => {
        this.ontology = ontology;
        this.ensureEditorSelections();
      },
      error: () => {
        this.ontology = this.createEmptyOntology();
      }
    });
  }

  protected updateEntities(entities: OntologyEntity[]): void {
    this.ontology = { ...this.ontology, entities, updatedAt: new Date().toISOString() };
    this.ensureEditorSelections();
  }

  protected updateSelectedEntity(entityId: string): void {
    this.selectedEntityId.set(entityId);
  }

  protected getEntityName(entityId: string): string {
    return this.ontology.entities.find((entity) => entity.id === entityId)?.name ?? 'Unmapped entity';
  }

  protected getPropertyLabel(entityId: string, propertyId?: string): string {
    if (!propertyId) {
      return 'Entity-level mapping';
    }
    const entity = this.ontology.entities.find((item) => item.id === entityId);
    const property = entity?.properties.find((item) => item.id === propertyId);
    return property?.name ?? propertyId;
  }

  protected saveOntology(): void {
    const request$ = this.ontology.id
      ? this.ontologyService.updateOntology(this.ontology.id, this.ontology)
      : this.ontologyService.createOntology(this.ontology);

    this.busy.set(true);
    request$.subscribe({
      next: (ontology) => {
        this.ontology = {
          ...this.ontology,
          ...ontology,
          id: ontology.id || `ontology-${Date.now()}`,
          updatedAt: new Date().toISOString()
        };
        this.statusMessage = 'Ontology saved successfully.';
        this.ensureEditorSelections();
        this.busy.set(false);
      },
      error: () => {
        this.ontology = {
          ...this.ontology,
          id: this.ontology.id || `ontology-${Date.now()}`,
          updatedAt: new Date().toISOString()
        };
        this.statusMessage = 'Saved locally. API unavailable.';
        this.busy.set(false);
      }
    });
  }

  protected submitForBinding(): void {
    if (!this.ontology.id) return;
    this.busy.set(true);
    this.workflow.submitForBinding(this.ontology.id).subscribe({
      next: (updated) => {
        this.ontology = updated;
        this.statusMessage = 'Submitted for IT data binding.';
        this.ensureEditorSelections();
        this.busy.set(false);
      },
      error: () => {
        this.statusMessage = 'Submit-for-binding failed.';
        this.busy.set(false);
      }
    });
  }

  protected submitForDeployment(): void {
    if (!this.ontology.id) return;
    this.busy.set(true);
    this.workflow.submitForDeployment(this.ontology.id).subscribe({
      next: (updated) => {
        this.ontology = updated;
        this.statusMessage = 'IT submission complete. TTL and JSON artifacts generated and staged in blob storage.';
        this.ensureEditorSelections();
        this.busy.set(false);
      },
      error: () => {
        this.statusMessage = 'Submit-for-deployment failed.';
        this.busy.set(false);
      }
    });
  }

  protected deployToFabric(): void {
    if (!this.ontology.id) return;
    this.busy.set(true);
    this.workflow.deploy(this.ontology.id).subscribe({
      next: (updated) => {
        this.ontology = updated.ontology;
        this.statusMessage = 'Deployment to Microsoft Fabric triggered.';
        this.ensureEditorSelections();
        this.busy.set(false);
      },
      error: () => {
        this.statusMessage = 'Deployment failed.';
        this.busy.set(false);
      }
    });
  }

  protected async exportToWord(): Promise<void> {
    this.busy.set(true);
    try {
      await this.exporter.exportToWord(this.ontology);
      this.statusMessage = 'Word document downloaded.';
    } catch {
      this.statusMessage = 'Word export failed.';
    } finally {
      this.busy.set(false);
    }
  }

  protected addRelationship(): void {
    if (!this.relationshipDraft.name.trim() || !this.relationshipDraft.fromEntityId || !this.relationshipDraft.toEntityId) {
      return;
    }

    const next: OntologyRelationship = {
      id: `relationship-${Date.now()}`,
      name: this.relationshipDraft.name.trim(),
      fromEntityId: this.relationshipDraft.fromEntityId,
      toEntityId: this.relationshipDraft.toEntityId,
      cardinality: this.relationshipDraft.cardinality,
      description: this.relationshipDraft.description?.trim() || undefined
    };

    this.ontology = {
      ...this.ontology,
      relationships: [...(this.ontology.relationships ?? []), next],
      updatedAt: new Date().toISOString()
    };

    this.relationshipDraft = {
      name: '',
      fromEntityId: this.ontology.entities[0]?.id ?? '',
      toEntityId: this.ontology.entities[1]?.id ?? this.ontology.entities[0]?.id ?? '',
      cardinality: 'one-to-many',
      description: ''
    };
  }

  protected removeRelationship(relationshipId: string): void {
    this.ontology = {
      ...this.ontology,
      relationships: (this.ontology.relationships ?? []).filter((relationship) => relationship.id !== relationshipId),
      updatedAt: new Date().toISOString()
    };
  }

  protected addBinding(): void {
    if (!this.bindingDraft.entityId || !this.bindingDraft.lakehouseTable.trim() || !this.bindingDraft.sourceField.trim()) {
      return;
    }

    const binding: OntologyBinding = {
      id: `binding-${Date.now()}`,
      entityId: this.bindingDraft.entityId,
      propertyId: this.bindingDraft.propertyId?.trim() || undefined,
      lakehouseTable: this.bindingDraft.lakehouseTable.trim(),
      lakehouseView: this.bindingDraft.lakehouseView?.trim() || undefined,
      sourceField: this.bindingDraft.sourceField.trim(),
      notes: this.bindingDraft.notes?.trim() || undefined
    };

    this.ontology = {
      ...this.ontology,
      bindings: [...(this.ontology.bindings ?? []), binding],
      updatedAt: new Date().toISOString(),
      status: this.ontology.status === 'awaiting_data_binding' ? 'binding_in_progress' : this.ontology.status
    };

    this.bindingDraft = {
      entityId: this.ontology.entities[0]?.id ?? '',
      propertyId: '',
      lakehouseTable: '',
      lakehouseView: '',
      sourceField: '',
      notes: ''
    };
  }

  protected removeBinding(bindingId: string): void {
    this.ontology = {
      ...this.ontology,
      bindings: (this.ontology.bindings ?? []).filter((binding) => binding.id !== bindingId),
      updatedAt: new Date().toISOString()
    };
  }

  protected propertiesForEntity(entityId: string): Array<{ id: string; name: string }> {
    return this.ontology.entities
      .find((entity) => entity.id === entityId)
      ?.properties.map((property) => ({ id: property.id, name: property.name })) ?? [];
  }

  protected rePromptGenerator(): void {
    this.statusMessage = 'Use Ontology Generator chat below to re-prompt and refine business entities.';
  }

  protected rePromptBinder(): void {
    this.statusMessage = 'Use Ontology Data Binder chat below to re-prompt and refine Lakehouse bindings.';
  }

  private ensureEditorSelections(): void {
    if (!this.ontology.bindings) {
      this.ontology = { ...this.ontology, bindings: [] };
    }

    if (!this.selectedEntityId() && this.ontology.entities.length) {
      this.selectedEntityId.set(this.ontology.entities[0].id);
    }

    this.relationshipDraft = {
      ...this.relationshipDraft,
      fromEntityId: this.relationshipDraft.fromEntityId || this.ontology.entities[0]?.id || '',
      toEntityId: this.relationshipDraft.toEntityId || this.ontology.entities[1]?.id || this.ontology.entities[0]?.id || ''
    };

    this.bindingDraft = {
      ...this.bindingDraft,
      entityId: this.bindingDraft.entityId || this.ontology.entities[0]?.id || ''
    };
  }

  private createEmptyOntology(): Ontology {
    const now = new Date().toISOString();

    return {
      id: '',
      name: 'New Fabric Ontology',
      description: 'Capture the business language, entities, and relationships for your domain.',
      status: 'draft',
      businessCase: '',
      createdAt: now,
      updatedAt: now,
      entities: [],
      relationships: [],
      bindings: []
    };
  }
}
