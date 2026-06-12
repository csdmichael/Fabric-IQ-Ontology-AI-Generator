import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, layersOutline, optionsOutline, sparklesOutline } from 'ionicons/icons';

@Component({
  selector: 'app-app-header',
  standalone: true,
  templateUrl: './app-header.component.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppHeaderComponent {
  protected readonly navItems = [
    { label: 'Home', path: '/', icon: 'homeOutline' },
    { label: 'Ontologies', path: '/ontologies', icon: 'layersOutline' },
    { label: 'Generate', path: '/generate', icon: 'sparklesOutline' },
    { label: 'Settings', path: '/settings', icon: 'optionsOutline' }
  ];

  constructor() {
    addIcons({ homeOutline, layersOutline, sparklesOutline, optionsOutline });
  }
}
