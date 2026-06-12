import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonTextarea
} from '@ionic/angular/standalone';

import { EntityListComponent } from '../../components/entity-list/entity-list.component';
import { OntologyGraphComponent } from '../../components/ontology-graph/ontology-graph.component';
import { Ontology, OntologyEntity } from '../../models/ontology.model';
import { OntologyService } from '../../services/ontology.service';

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
    IonInput,
    IonTextarea,
    IonButton,
    IonText,
    EntityListComponent,
    OntologyGraphComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ontologyService = inject(OntologyService);

  protected ontology: Ontology = this.createEmptyOntology();
  protected statusMessage = 'Edit ontology metadata, entities, and data bindings.';

  ngOnInit(): void {
    const stateOntology = history.state.ontology as Ontology | undefined;
    const ontologyId = this.route.snapshot.paramMap.get('id');

    if (stateOntology) {
      this.ontology = stateOntology;
      return;
    }

    if (!ontologyId || ontologyId === 'new') {
      return;
    }

    this.ontologyService.getOntology(ontologyId).subscribe({
      next: (ontology) => {
        this.ontology = ontology;
      },
      error: () => {
        this.ontology = this.createEmptyOntology();
      }
    });
  }

  protected updateEntities(entities: OntologyEntity[]): void {
    this.ontology = { ...this.ontology, entities, updatedAt: new Date().toISOString() };
  }

  protected saveOntology(): void {
    const request$ = this.ontology.id
      ? this.ontologyService.updateOntology(this.ontology.id, this.ontology)
      : this.ontologyService.createOntology(this.ontology);

    request$.subscribe({
      next: (ontology) => {
        this.ontology = {
          ...this.ontology,
          ...ontology,
          id: ontology.id || `ontology-${Date.now()}`,
          updatedAt: new Date().toISOString()
        };
        this.statusMessage = 'Ontology saved successfully.';
      },
      error: () => {
        this.ontology = {
          ...this.ontology,
          id: this.ontology.id || `ontology-${Date.now()}`,
          updatedAt: new Date().toISOString()
        };
        this.statusMessage = 'Saved locally. API unavailable.';
      }
    });
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
      entities: []
    };
  }
}
