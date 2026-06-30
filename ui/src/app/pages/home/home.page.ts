import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { sparklesOutline, cubeOutline, rocketOutline, shieldCheckmarkOutline, documentOutline, settingsOutline, chevronForwardOutline, layersOutline, logoGithub, bulbOutline, searchOutline, businessOutline, megaphoneOutline, peopleOutline, documentLockOutline, cashOutline, serverOutline, arrowForwardOutline, gitNetworkOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { Permission } from '../../models/auth.model';
import { Ontology } from '../../models/ontology.model';
import { OntologyService } from '../../services/ontology.service';

interface KpiCard {
  title: string;
  value: string;
  detail: string;
  icon: string;
  accent: 'primary' | 'secondary' | 'tertiary' | 'success';
  tone: 'positive' | 'neutral' | 'caution';
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
  private readonly ontologies = signal<Ontology[]>([]);
  private readonly lastRefresh = signal<Date | null>(null);

  constructor() {
    addIcons({sparklesOutline,chevronForwardOutline,cubeOutline,rocketOutline,layersOutline,bulbOutline,searchOutline,businessOutline,megaphoneOutline,peopleOutline,documentLockOutline,cashOutline,serverOutline,arrowForwardOutline,gitNetworkOutline,checkmarkDoneOutline,shieldCheckmarkOutline,documentOutline,settingsOutline,logoGithub});
  }

  // Expose auth service for template
  protected auth$ = this.auth;

  protected readonly kpiCards = computed(() => this.buildKpiCards(this.ontologies()));
  protected readonly lastRefreshLabel = computed(() => this.formatLastRefresh(this.lastRefresh()));
  protected readonly hasLiveData = computed(() => this.ontologies().length > 0);

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
        this.ontologies.set(ontologies);
        this.lastRefresh.set(new Date());
      },
      error: () => {
        this.ontologies.set([]);
        this.lastRefresh.set(new Date());
      }
    });
  }

  private buildKpiCards(ontologies: Ontology[]): KpiCard[] {
    const total = ontologies.length;
    const draftCount = ontologies.filter((ontology) => ontology.status === 'draft' || ontology.status === 'generated').length;
    const bindingQueue = ontologies.filter((ontology) => ontology.status === 'awaiting_data_binding' || ontology.status === 'binding_in_progress').length;
    const deploymentQueue = ontologies.filter((ontology) => ontology.status === 'awaiting_deployment' || ontology.status === 'deploying').length;
    const publishedCount = ontologies.filter((ontology) => ontology.status === 'published').length;
    const artifactCount = ontologies.filter((ontology) => (ontology.artifactFiles?.length ?? 0) > 0).length;
    const completionRate = total > 0 ? Math.round((publishedCount / total) * 100) : 0;

    return [
      {
        title: 'Ontologies',
        value: String(total),
        detail: 'Live workspaces currently in the catalog',
        icon: 'layers-outline',
        accent: 'primary',
        tone: total > 0 ? 'positive' : 'neutral'
      },
      {
        title: 'Drafts in motion',
        value: String(draftCount),
        detail: 'Business authored concepts being shaped',
        icon: 'sparkles-outline',
        accent: 'secondary',
        tone: draftCount > 0 ? 'neutral' : 'caution'
      },
      {
        title: 'Binding queue',
        value: String(bindingQueue + deploymentQueue),
        detail: 'Items waiting on IT review or deployment approval',
        icon: 'cube-outline',
        accent: 'tertiary',
        tone: bindingQueue + deploymentQueue > 0 ? 'neutral' : 'caution'
      },
      {
        title: 'Published live',
        value: `${completionRate}%`,
        detail: `${publishedCount} deployed · ${artifactCount} with artifacts`,
        icon: 'rocket-outline',
        accent: 'success',
        tone: publishedCount > 0 ? 'positive' : 'caution'
      }
    ];
  }

  private formatLastRefresh(timestamp: Date | null): string {
    if (!timestamp) {
      return 'Waiting for live data';
    }

    return `Updated ${timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
}
