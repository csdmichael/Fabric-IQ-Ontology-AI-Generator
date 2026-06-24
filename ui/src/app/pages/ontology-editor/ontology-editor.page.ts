import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, chevronBack, chevronForward, cloudUploadOutline, documentTextOutline, refreshOutline, rocketOutline, settingsOutline, trashOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

import { AgentChatComponent } from '../../components/agent-chat/agent-chat.component';
import { EntityListComponent } from '../../components/entity-list/entity-list.component';
import { OntologyGraphComponent } from '../../components/ontology-graph/ontology-graph.component';
import { Ontology, OntologyBinding, OntologyEntity, OntologyRelationship, ontologyStatusLabel } from '../../models/ontology.model';
import { AuthService } from '../../services/auth.service';
import { DatasourceService, DataSourceConnection, FabricConnectionSettings } from '../../services/datasource.service';
import { OntologyExportService } from '../../services/ontology-export.service';
import { OntologyService } from '../../services/ontology.service';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-ontology-editor-page',
  standalone: true,
  templateUrl: './ontology-editor.page.html',
  styleUrls: ['./ontology-editor.page.scss'],
  imports: [
    CommonModule,
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
    IonChip,
    IonSegment,
    IonSegmentButton,
    EntityListComponent,
    OntologyGraphComponent,
    AgentChatComponent,
    RouterLink
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ontologyService = inject(OntologyService);
  private readonly workflow = inject(WorkflowService);
  private readonly exporter = inject(OntologyExportService);
  private readonly auth = inject(AuthService);
  private readonly datasourceService = inject(DatasourceService);

  protected ontology: Ontology = this.createEmptyOntology();
  protected statusMessage = 'Draft ontology with business entities first. Fabric bindings are added later by IT.';
  protected connectionMessage = 'Configure the active Fabric workspace before binding to a lakehouse.';
  protected readonly selectedEntityId = signal<string | undefined>(undefined);
  protected readonly busy = signal(false);
  protected readonly guidedMode = signal(true);
  protected readonly currentStep = signal(1);
  protected readonly availableDatasources = signal<DataSourceConnection[]>([]);
  protected readonly selectedDatasource = signal<string | undefined>(undefined);
  protected connectionSettings: FabricConnectionSettings = {
    workspaceId: '',
    capacityId: '',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    storageContainer: '',
    storageConnectionString: ''
  };
  protected readonly steps = [
    { id: 1, label: 'Metadata', title: 'Business Basics' },
    { id: 2, label: 'Entities', title: 'Define Entities' },
    { id: 3, label: 'Relationships', title: 'Connect Entities' },
    { id: 4, label: 'Review', title: 'Review & Save' }
  ];
  protected readonly canGenerator = computed(() => this.auth.hasPermission('agent:ontology-generator'));
  protected readonly canBinder = computed(() => this.auth.hasPermission('agent:ontology-data-binder'));
  protected readonly canSubmitBinding = computed(() => this.auth.hasPermission('ontology:submit-for-binding'));
  protected readonly canSubmitDeployment = computed(() => this.auth.hasPermission('ontology:submit-for-deployment'));
  protected readonly canDeploy = computed(() => this.auth.hasPermission('ontology:deploy-to-fabric'));
  protected readonly isItUser = computed(() => this.auth.hasPermission('ontology:bind-data'));
  protected readonly isBusinessUser = computed(() => !this.isItUser());
  protected readonly canAdvanceStep = computed(() => this.validateStep(this.currentStep()));

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
    addIcons({settingsOutline,addOutline,trashOutline,cloudUploadOutline,documentTextOutline,chevronBackOutline,chevronForwardOutline,refreshOutline,rocketOutline,chevronBack,chevronForward});
  }

  ngOnInit(): void {
    this.datasourceService.getSettings().subscribe({
      next: (settings) => {
        this.connectionSettings = settings;
      },
      error: () => {
        this.connectionMessage = 'Using local defaults. Save configuration to persist the Fabric connection.';
      }
    });

    // Load available datasources for IT bindings
    this.datasourceService.listDataSources().subscribe({
      next: (datasources) => {
        this.availableDatasources.set(datasources);
      },
      error: () => {
        this.availableDatasources.set([]);
      }
    });

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

  protected applyDatasourceSelection(datasourceId?: string): void {
    this.selectedDatasource.set(datasourceId || undefined);

    if (!datasourceId) {
      return;
    }

    const datasource = this.availableDatasources().find((item) => item.id === datasourceId);
    if (!datasource) {
      return;
    }

    this.bindingDraft = {
      ...this.bindingDraft,
      lakehouseTable: datasource.type === 'view' ? this.bindingDraft.lakehouseTable : datasource.itemName,
      lakehouseView: datasource.type === 'view' ? datasource.itemName : this.bindingDraft.lakehouseView,
      sourceField: this.bindingDraft.sourceField || 'id'
    };

    this.statusMessage = `Selected ${datasource.name}. Review the lakehouse mapping before adding the binding.`;
  }

  protected saveConnectionSettings(): void {
    this.busy.set(true);
    this.datasourceService.saveSettings(this.connectionSettings).subscribe({
      next: (settings) => {
        this.connectionSettings = settings;
        this.connectionMessage = 'Fabric connection saved for this workspace.';
        this.busy.set(false);
      },
      error: () => {
        this.connectionMessage = 'Connection saved locally. API unavailable.';
        this.busy.set(false);
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

  /** Human-friendly label for the current ontology lifecycle status. */
  protected statusLabel(): string {
    return ontologyStatusLabel(this.ontology.status);
  }

  /** Ionic chip color reflecting how far the ontology has progressed. */
  protected statusColor(): string {
    switch (this.ontology.status) {
      case 'published':
        return 'success';
      case 'awaiting_deployment':
      case 'deploying':
        return 'tertiary';
      case 'binding_in_progress':
        return 'secondary';
      case 'awaiting_data_binding':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  }

  /** The OneLake table or view an entity is bound to, if any. */
  protected entityBoundSource(entity: OntologyEntity): string {
    if (entity.sourceView) {
      return `${entity.sourceView} (view)`;
    }
    if (entity.sourceTable) {
      return `${entity.sourceTable} (table)`;
    }
    return 'Not bound yet';
  }

  /** Whether any entity or property in the ontology has a OneLake binding. */
  protected hasAnyBinding(): boolean {
    return this.ontology.entities.some(
      (entity) =>
        !!entity.sourceTable ||
        !!entity.sourceView ||
        entity.properties.some((property) => !!property.sourceColumn)
    );
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
    this.selectedDatasource.set(undefined);
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

  protected toggleGuidedMode(): void {
    this.guidedMode.set(!this.guidedMode());
  }

  protected nextStep(): void {
    if (this.currentStep() < 4) {
      this.currentStep.set(this.currentStep() + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected setStep(step: number): void {
    this.currentStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected validateStep(step: number): boolean {
    switch (step) {
      case 1: return this.ontology.name?.trim().length > 0;
      case 2: return this.ontology.entities.length > 0;
      case 3: return true; // Relationships are optional
      case 4: return true; // Review is always available
      default: return false;
    }
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
