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
import { homeOutline, layersOutline, optionsOutline, sparklesOutline, logoLinkedin, logoGithub } from 'ionicons/icons';

@Component({
  selector: 'app-app-header',
  standalone: true,
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
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

  protected readonly profileInfo = {
    name: 'Michael Yaacoub',
    title: 'Sr Solution Engineer',
    linkedIn: 'https://www.linkedin.com/in/michael-yaacoub-7a46436/',
    github: 'https://www.github.com/csdmichael'
  };

  constructor() {
    addIcons({logoLinkedin,logoGithub,homeOutline,layersOutline,sparklesOutline,optionsOutline});
  }
}
