import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  IonApp,
  IonButton,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonRouterOutlet,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  buildOutline,
  cubeOutline,
  documentTextOutline,
  homeOutline,
  layersOutline,
  libraryOutline,
  logOutOutline,
  optionsOutline,
  peopleOutline,
  personCircleOutline,
  serverOutline,
  sparklesOutline
} from 'ionicons/icons';

import { Permission } from './models/auth.model';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  permission?: Permission;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    IonApp,
    IonMenu,
    IonHeader,
    IonFooter,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonRouterOutlet,
    IonMenuButton,
    IonChip,
    IonButton
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly branding = environment.branding;
  protected readonly portalTitle = this.branding.shortName;
  protected readonly portalSubtitle = 'Ontology AI Generator';
  protected readonly year = new Date().getFullYear();

  protected readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  protected readonly currentUser = computed(() => this.auth.user());

  private readonly _currentUrl = signal(this.router.url);
  protected readonly showAppChrome = computed(() => !this._currentUrl().startsWith('/login'));

  private readonly allSections: NavSection[] = [
    {
      title: 'Business Ontology Builder',
      items: [
        { label: 'Home', path: '/', icon: 'home-outline' },
        { label: 'Generate ontology', path: '/generate', icon: 'sparkles-outline', permission: 'agent:ontology-generator' },
        { label: 'My ontologies', path: '/ontologies', icon: 'layers-outline', permission: 'ontology:read' }
      ]
    },
    {
      title: 'IT Ontology Data Integration',
      items: [
        { label: 'Bind to Lakehouse', path: '/ontologies', icon: 'cube-outline', permission: 'agent:ontology-data-binder' },
        { label: 'Datasources', path: '/settings', icon: 'server-outline', permission: 'datasource:read' }
      ]
    },
    {
      title: 'System Documentation',
      items: [
        { label: 'Project architecture', path: '/architecture', icon: 'document-text-outline' },
        { label: 'User management', path: '/users', icon: 'people-outline', permission: 'users:read' }
      ]
    }
  ];

  protected readonly navSections = computed<NavSection[]>(() => {
    const has = (perm?: Permission) => !perm || this.auth.hasPermission(perm);
    return this.allSections
      .map((section) => ({ ...section, items: section.items.filter((i) => has(i.permission)) }))
      .filter((section) => section.items.length > 0);
  });

  constructor() {
    addIcons({homeOutline,sparklesOutline,layersOutline,cubeOutline,serverOutline,documentTextOutline,peopleOutline,personCircleOutline,logOutOutline,analyticsOutline,buildOutline,optionsOutline,libraryOutline});

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this._currentUrl.set(event.urlAfterRedirects);
      }
    });

    if (this.auth.isAuthenticated()) {
      this.auth.refreshMe().catch(() => undefined);
    }
  }

  protected onLogout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  protected onLogin(): void {
    void this.router.navigate(['/login']);
  }
}
