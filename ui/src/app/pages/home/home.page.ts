import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sparklesOutline, cubeOutline, rocketOutline, shieldCheckmarkOutline, documentOutline, settingsOutline, chevronForwardOutline, layersOutline, logoGithub } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { Permission } from '../../models/auth.model';
import { OntologyService } from '../../services/ontology.service';

interface SummaryCard {
  title: string;
  value: string;
  detail: string;
}

interface RoleAction {
  title: string;
  description: string;
  action: string;
  icon: string;
  link: string;
  permission: Permission;
  color: 'primary' | 'secondary' | 'tertiary';
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonChip, IonText, IonIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit {
  private readonly ontologyService = inject(OntologyService);
  private readonly auth = inject(AuthService);

  constructor() {
    addIcons({sparklesOutline,chevronForwardOutline,cubeOutline,rocketOutline,documentOutline,settingsOutline,layersOutline,shieldCheckmarkOutline,logoGithub});
  }

  // Expose auth service for template
  protected auth$ = this.auth;

  protected summaryCards: SummaryCard[] = [
    { title: 'Business drafts', value: '0', detail: 'Ontologies created from plain English prompts' },
    { title: 'IT-ready submissions', value: '0', detail: 'Drafts handed to IT for Fabric binding' },
    { title: 'Deployment packages', value: '0', detail: 'Ontologies with generated ttl/json artifacts' }
  ];

  protected readonly isBusinessUser = computed(() => this.auth.hasPermission('agent:ontology-generator'));
  protected readonly isItUser = computed(() => this.auth.hasPermission('ontology:bind-data'));
  protected readonly isAdmin = computed(() => this.auth.hasPermission('ontology:deploy-to-fabric'));

  protected readonly roleActions: RoleAction[] = [
    {
      title: 'Business User',
      description: 'Domain Expert — Shape entities and relationships',
      action: 'Start Generating',
      icon: 'sparkles-outline',
      link: '/generate',
      permission: 'agent:ontology-generator',
      color: 'primary'
    },
    {
      title: 'IT User',
      description: 'Data Engineer — Bind ontologies to Fabric tables',
      action: 'Open Studio',
      icon: 'cube-outline',
      link: '/ontologies',
      permission: 'ontology:bind-data',
      color: 'secondary'
    },
    {
      title: 'Admin',
      description: 'Governance — Approve & deploy to Fabric',
      action: 'Review & Deploy',
      icon: 'rocket-outline',
      link: '/ontologies',
      permission: 'ontology:deploy-to-fabric',
      color: 'tertiary'
    }
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
