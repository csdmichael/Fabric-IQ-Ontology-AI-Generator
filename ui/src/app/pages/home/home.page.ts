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
    { title: 'Draft ontologies', value: '0', detail: 'AI-generated models ready for review' },
    { title: 'Connected sources', value: '0', detail: 'OneLake tables, views, and endpoints' },
    { title: 'Workspace status', value: 'Ready', detail: 'Configuration can be completed in Settings' }
  ];

  ngOnInit(): void {
    this.ontologyService.listOntologies().subscribe({
      next: (ontologies) => {
        this.summaryCards = [
          { title: 'Draft ontologies', value: String(ontologies.length), detail: 'Business-aligned ontology workspaces' },
          {
            title: 'Connected sources',
            value: String(ontologies.reduce((total, ontology) => total + ontology.entities.length, 0)),
            detail: 'Entities linked to Fabric data assets'
          },
          { title: 'Workspace status', value: 'Ready', detail: 'Configure Fabric, Cosmos, and AI services' }
        ];
      },
      error: () => {
        this.summaryCards = [
          { title: 'Draft ontologies', value: '0', detail: 'Business-aligned ontology workspaces' },
          { title: 'Connected sources', value: '0', detail: 'Entities linked to Fabric data assets' },
          { title: 'Workspace status', value: 'Ready', detail: 'Configure Fabric, Cosmos, and AI services' }
        ];
      }
    });
  }
}
