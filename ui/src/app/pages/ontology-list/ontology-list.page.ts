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
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { OntologyCardComponent } from '../../components/ontology-card/ontology-card.component';
import { Ontology, OntologyBinding } from '../../models/ontology.model';
import { DataSourceConnection, DatasourceService } from '../../services/datasource.service';
import { OntologyService } from '../../services/ontology.service';

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
    RouterLink,
    OntologyCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyListPage implements OnInit {
  private readonly ontologyService = inject(OntologyService);
  private readonly datasourceService = inject(DatasourceService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected ontologies: Ontology[] = [];

  protected readonly bindModalOpen = signal(false);
  protected readonly bindTarget = signal<Ontology | undefined>(undefined);
  protected readonly connections = signal<DataSourceConnection[]>([]);
  protected readonly bindMode = signal<'existing' | 'new'>('existing');
  protected readonly bindBusy = signal(false);
  protected bindMessage = '';
  protected selectedConnectionId = '';

  protected newConnection: Omit<DataSourceConnection, 'id'> = this.createEmptyConnection();

  constructor() {
    addIcons({ addOutline, closeOutline });
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
    this.selectedConnectionId = '';
    this.newConnection = this.createEmptyConnection();
    this.bindMessage = '';
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

    this.bindOntologyToConnection(ontology, connection);
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
          this.bindOntologyToConnection(ontology, connection);
        },
        error: () => {
          this.bindBusy.set(false);
          this.bindMessage = 'Could not create the connection. Check the workspace details and try again.';
          this.cdr.markForCheck();
        }
      });
  }

  private bindOntologyToConnection(ontology: Ontology, connection: DataSourceConnection): void {
    this.bindBusy.set(true);
    this.bindMessage = `Binding "${ontology.name}" to ${connection.name}...`;
    this.cdr.markForCheck();

    const isView = connection.type === 'view';
    const binding: OntologyBinding = {
      id: `bind-${connection.id}-${Date.now()}`,
      entityId: ontology.entities[0]?.id ?? '',
      lakehouseTable: isView ? '' : connection.itemName,
      lakehouseView: isView ? connection.itemName : undefined,
      sourceField: 'id',
      notes: `Bound to OneLake connection ${connection.name} (workspace ${connection.workspaceId}).`
    };

    const payload: Partial<Ontology> = {
      bindings: [...(ontology.bindings ?? []), binding],
      status: 'binding_in_progress'
    };

    this.ontologyService
      .updateOntology(ontology.id, payload)
      .pipe(finalize(() => this.bindBusy.set(false)))
      .subscribe({
        next: (updated) => {
          this.ontologies = this.ontologies.map((item) => (item.id === updated.id ? updated : item));
          this.bindMessage = `Bound to ${connection.name}.`;
          this.closeBindModal();
          this.cdr.markForCheck();
        },
        error: () => {
          this.bindMessage = 'Binding could not be saved. Please try again.';
          this.cdr.markForCheck();
        }
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
