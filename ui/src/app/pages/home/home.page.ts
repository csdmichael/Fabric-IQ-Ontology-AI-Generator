import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonText
} from '@ionic/angular/standalone';
import { OntologyService } from '../../services/ontology.service';

interface SummaryCard {
  title: string;
  value: string;
  detail: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  templateUrl: './home.page.html',
  imports: [IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonChip, IonText, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit {
  private readonly ontologyService = inject(OntologyService);

  protected summaryCards: SummaryCard[] = [
    { title: 'Business drafts', value: '0', detail: 'Ontologies created from plain English prompts' },
    { title: 'IT-ready submissions', value: '0', detail: 'Drafts handed to IT for Fabric binding' },
    { title: 'Deployment packages', value: '0', detail: 'Ontologies with generated ttl/json artifacts' }
  ];

  ngOnInit(): void {
    this.ontologyService.listOntologies().subscribe({
      next: (ontologies) => {
        const waitingForIt = ontologies.filter((ontology) => ontology.status === 'awaiting_data_binding').length;
        const packaged = ontologies.filter((ontology) => (ontology.artifactFiles?.length ?? 0) > 0).length;
        this.summaryCards = [
          { title: 'Business drafts', value: String(ontologies.length), detail: 'Business-aligned ontology workspaces' },
          {
            title: 'IT-ready submissions',
            value: String(waitingForIt),
            detail: 'Drafts waiting for IT data binding'
          },
          { title: 'Deployment packages', value: String(packaged), detail: 'TTL + JSON artifacts staged in blob storage' }
        ];
      },
      error: () => {
        this.summaryCards = [
          { title: 'Business drafts', value: '0', detail: 'Business-aligned ontology workspaces' },
          { title: 'IT-ready submissions', value: '0', detail: 'Drafts waiting for IT data binding' },
          { title: 'Deployment packages', value: '0', detail: 'TTL + JSON artifacts staged in blob storage' }
        ];
      }
    });
  }
}
