import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonRadio,
  IonRadioGroup,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, checkmarkCircleOutline, closeOutline, sparklesOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { OntologyCardComponent } from '../../components/ontology-card/ontology-card.component';
import { Ontology, OntologyBinding } from '../../models/ontology.model';
import { DataSourceConnection, DatasourceService } from '../../services/datasource.service';
import { OntologyService } from '../../services/ontology.service';
import { WorkflowService } from '../../services/workflow.service';

interface ReviewProperty {
  propertyId: string;
  name: string;
  field: string;
}

interface ReviewEntity {
  entityId: string;
  entityName: string;
  table: string;
  isView: boolean;
  properties: ReviewProperty[];
}

@Component({
  selector: 'app-ontology-list-page',
  standalone: true,
  templateUrl: './ontology-list.page.html',
  styleUrls: ['./ontology-list.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonButton,
    IonFab,
    IonFabButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonNote,
    IonRadio,
    IonRadioGroup,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    IonTextarea,
    RouterLink,
    OntologyCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyListPage implements OnInit {
  private readonly ontologyService = inject(OntologyService);
  private readonly datasourceService = inject(DatasourceService);
  private readonly workflow = inject(WorkflowService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected ontologies: Ontology[] = [];

  protected readonly bindModalOpen = signal(false);
  protected readonly bindTarget = signal<Ontology | undefined>(undefined);
  protected readonly connections = signal<DataSourceConnection[]>([]);
  protected readonly bindMode = signal<'existing' | 'new'>('existing');
  protected readonly bindBusy = signal(false);
  protected bindMessage = '';
  protected selectedConnectionId = '';

  /** Multi-phase binding workflow: pick connection -> agent runs -> review mappings. */
  protected readonly bindPhase = signal<'select' | 'running' | 'review'>('select');
  protected readonly agentReply = signal('');
  protected readonly agentDelivered = signal(false);
  protected readonly boundConnection = signal<DataSourceConnection | undefined>(undefined);
  protected readonly reviewEntities = signal<ReviewEntity[]>([]);
  protected readonly submitted = signal(false);
  protected repromptText = '';

  protected newConnection: Omit<DataSourceConnection, 'id'> = this.createEmptyConnection();

  constructor() {
    addIcons({ addOutline, checkmarkCircleOutline, closeOutline, sparklesOutline });
  }

  ngOnInit(): void {
    this.loadOntologies();
  }

  ionViewWillEnter(): void {
    this.loadOntologies();
  }

  protected removeOntology(id: string): void {
    this.ontologyService.deleteOntology(id).subscribe({
      next: () => {
        this.ontologies = this.ontologies.filter((ontology) => ontology.id !== id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.ontologies = this.ontologies.filter((ontology) => ontology.id !== id);
        this.cdr.markForCheck();
      }
    });
  }

  protected openBindModal(ontology: Ontology): void {
    this.bindTarget.set(ontology);
    this.bindMode.set('existing');
    this.bindPhase.set('select');
    this.selectedConnectionId = '';
    this.newConnection = this.createEmptyConnection();
    this.bindMessage = '';
    this.agentReply.set('');
    this.reviewEntities.set([]);
    this.boundConnection.set(undefined);
    this.submitted.set(false);
    this.repromptText = '';
    this.bindModalOpen.set(true);

    this.datasourceService.listDataSources().subscribe({
      next: (connections) => {
        this.connections.set(connections);
        this.selectedConnectionId = connections[0]?.id ?? '';
        if (!connections.length) {
          this.bindMode.set('new');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.connections.set([]);
        this.bindMode.set('new');
        this.cdr.markForCheck();
      }
    });
  }

  protected closeBindModal(): void {
    this.bindModalOpen.set(false);
    this.bindTarget.set(undefined);
    this.bindPhase.set('select');
  }

  protected setBindMode(mode: 'existing' | 'new'): void {
    this.bindMode.set(mode);
  }

  protected confirmBinding(): void {
    const ontology = this.bindTarget();
    if (!ontology) {
      return;
    }

    if (this.bindMode() === 'new') {
      this.createConnectionThenBind(ontology);
      return;
    }

    const connection = this.connections().find((item) => item.id === this.selectedConnectionId);
    if (!connection) {
      this.bindMessage = 'Select a connection to bind.';
      return;
    }

    this.runAutoBind(ontology, connection);
  }

  protected rerunAgent(): void {
    const ontology = this.bindTarget();
    const connection = this.boundConnection();
    if (!ontology || !connection) {
      return;
    }
    this.runAutoBind(ontology, connection, this.repromptText.trim() || undefined);
  }

  /** Updates the lakehouse table/view for every binding of an entity. */
  protected updateEntityTable(entityId: string, table: string): void {
    this.reviewEntities.set(
      this.reviewEntities().map((entity) => (entity.entityId === entityId ? { ...entity, table } : entity))
    );
  }

  /** Updates the source field for a single property binding. */
  protected updatePropertyField(entityId: string, propertyId: string, field: string): void {
    this.reviewEntities.set(
      this.reviewEntities().map((entity) =>
        entity.entityId === entityId
          ? {
              ...entity,
              properties: entity.properties.map((property) =>
                property.propertyId === propertyId ? { ...property, field } : property
              )
            }
          : entity
      )
    );
  }

  protected saveAndSubmit(): void {
    const ontology = this.bindTarget();
    if (!ontology) {
      return;
    }

    this.bindBusy.set(true);
    this.bindMessage = 'Saving bindings and generating deployment package...';
    this.cdr.markForCheck();

    const bindings = this.bindingsFromReview();
    const entities = this.applyMappingsToEntities(ontology);

    this.ontologyService
      .updateOntology(ontology.id, { entities, bindings, status: 'binding_in_progress' })
      .subscribe({
        next: () => {
          this.workflow
            .submitForDeployment(ontology.id)
            .pipe(finalize(() => this.bindBusy.set(false)))
            .subscribe({
              next: (updated) => {
                this.ontologies = this.ontologies.map((item) => (item.id === updated.id ? updated : item));
                this.submitted.set(true);
                this.bindMessage = 'Ontology submitted. TTL + JSON artifacts saved to Blob storage and Cosmos DB. Awaiting admin deployment.';
                this.cdr.markForCheck();
              },
              error: () => {
                this.bindMessage = 'Bindings saved, but submitting the deployment package failed. Please retry.';
                this.cdr.markForCheck();
              }
            });
        },
        error: () => {
          this.bindBusy.set(false);
          this.bindMessage = 'Could not save the bindings. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  private createConnectionThenBind(ontology: Ontology): void {
    if (!this.newConnection.name.trim() || !this.newConnection.itemName.trim()) {
      this.bindMessage = 'Connection name and Lakehouse table/item are required.';
      return;
    }

    this.bindBusy.set(true);
    this.bindMessage = 'Creating connection...';
    this.cdr.markForCheck();

    this.datasourceService
      .createDataSource({
        name: this.newConnection.name.trim(),
        type: this.newConnection.type,
        workspaceId: this.newConnection.workspaceId.trim(),
        itemName: this.newConnection.itemName.trim()
      })
      .subscribe({
        next: (connection) => {
          this.connections.set([...this.connections(), connection]);
          this.runAutoBind(ontology, connection);
        },
        error: () => {
          this.bindBusy.set(false);
          this.bindMessage = 'Could not create the connection. Check the workspace details and try again.';
          this.cdr.markForCheck();
        }
      });
  }

  private runAutoBind(ontology: Ontology, connection: DataSourceConnection, guidance?: string): void {
    this.boundConnection.set(connection);
    this.bindPhase.set('running');
    this.bindBusy.set(true);
    this.bindMessage = `IT data binder agent is mapping "${ontology.name}" to ${connection.name}...`;
    this.cdr.markForCheck();

    this.workflow
      .autoBind(ontology.id, connection.id, guidance)
      .pipe(finalize(() => this.bindBusy.set(false)))
      .subscribe({
        next: (result) => {
          this.bindTarget.set(result.ontology);
          this.ontologies = this.ontologies.map((item) => (item.id === result.ontology.id ? result.ontology : item));
          this.agentReply.set(result.agent.reply);
          this.agentDelivered.set(result.agent.delivered);
          this.reviewEntities.set(this.buildReviewEntities(result.ontology));
          this.bindMessage = '';
          this.repromptText = '';
          this.bindPhase.set('review');
          this.cdr.markForCheck();
        },
        error: () => {
          this.bindPhase.set('select');
          this.bindMessage = 'The IT agent could not complete the mapping. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  private buildReviewEntities(ontology: Ontology): ReviewEntity[] {
    const bindings = ontology.bindings ?? [];
    return ontology.entities.map((entity) => {
      const entityBinding = bindings.find((binding) => binding.entityId === entity.id && !binding.propertyId);
      const isView = !!entityBinding?.lakehouseView;
      const table = entityBinding?.lakehouseView || entityBinding?.lakehouseTable || '';
      return {
        entityId: entity.id,
        entityName: entity.name,
        table,
        isView,
        properties: entity.properties.map((property) => {
          const propertyBinding = bindings.find(
            (binding) => binding.entityId === entity.id && binding.propertyId === property.id
          );
          return {
            propertyId: property.id,
            name: property.name,
            field: propertyBinding?.sourceField || property.sourceColumn || ''
          };
        })
      };
    });
  }

  private bindingsFromReview(): OntologyBinding[] {
    const bindings: OntologyBinding[] = [];
    for (const entity of this.reviewEntities()) {
      bindings.push({
        id: `bind-${entity.entityId}`,
        entityId: entity.entityId,
        lakehouseTable: entity.isView ? '' : entity.table,
        lakehouseView: entity.isView ? entity.table : undefined,
        sourceField: entity.properties[0]?.field || 'id',
        notes: `Mapped to ${entity.table} by the IT data binder.`
      });
      for (const property of entity.properties) {
        bindings.push({
          id: `bind-${entity.entityId}-${property.propertyId}`,
          entityId: entity.entityId,
          propertyId: property.propertyId,
          lakehouseTable: entity.isView ? '' : entity.table,
          lakehouseView: entity.isView ? entity.table : undefined,
          sourceField: property.field || property.name
        });
      }
    }
    return bindings;
  }

  private applyMappingsToEntities(ontology: Ontology): Ontology['entities'] {
    return ontology.entities.map((entity) => {
      const review = this.reviewEntities().find((item) => item.entityId === entity.id);
      if (!review) {
        return entity;
      }
      return {
        ...entity,
        sourceTable: review.isView ? entity.sourceTable : review.table,
        sourceView: review.isView ? review.table : entity.sourceView,
        properties: entity.properties.map((property) => {
          const reviewProperty = review.properties.find((item) => item.propertyId === property.id);
          return {
            ...property,
            sourceColumn: reviewProperty?.field || property.sourceColumn,
            sourceTable: review.isView ? property.sourceTable : review.table,
            sourceView: review.isView ? review.table : property.sourceView
          };
        })
      };
    });
  }

  private createEmptyConnection(): Omit<DataSourceConnection, 'id'> {
    return {
      name: '',
      type: 'lakehouse',
      workspaceId: '',
      itemName: ''
    };
  }

  private loadOntologies(): void {
    this.ontologyService.listOntologies().subscribe({
      next: (ontologies) => {
        this.ontologies = ontologies;
        this.cdr.markForCheck();
      },
      error: () => {
        this.ontologies = [];
        this.cdr.markForCheck();
      }
    });
  }
}
