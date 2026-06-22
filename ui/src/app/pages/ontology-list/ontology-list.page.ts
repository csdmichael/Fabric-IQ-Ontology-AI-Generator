import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonFab, IonFabButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';

import { OntologyCardComponent } from '../../components/ontology-card/ontology-card.component';
import { Ontology } from '../../models/ontology.model';
import { OntologyService } from '../../services/ontology.service';

@Component({
  selector: 'app-ontology-list-page',
  standalone: true,
  templateUrl: './ontology-list.page.html',
  imports: [IonContent, IonButton, IonFab, IonFabButton, IonIcon, IonText, RouterLink, OntologyCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyListPage implements OnInit {
  private readonly ontologyService = inject(OntologyService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected ontologies: Ontology[] = [];

  constructor() {
    addIcons({ addOutline });
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
