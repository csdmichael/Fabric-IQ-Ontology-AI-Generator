import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonFooter, IonText, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-app-footer',
  standalone: true,
  templateUrl: './app-footer.component.html',
  imports: [IonFooter, IonToolbar, IonText],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFooterComponent {
  protected readonly year = new Date().getFullYear();
}
