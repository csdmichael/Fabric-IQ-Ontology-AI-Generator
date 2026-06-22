import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonFooter, IonIcon, IonText, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoLinkedin, logoGithub } from 'ionicons/icons';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-app-footer',
  standalone: true,
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss'],
  imports: [CommonModule, IonFooter, IonToolbar, IonText, IonButton, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFooterComponent {
  protected readonly year = new Date().getFullYear();
  protected readonly branding = environment.branding;

  constructor() {
    addIcons({ logoLinkedin, logoGithub });
  }
}
