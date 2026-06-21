import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonText
} from '@ionic/angular/standalone';

import { DatasourceService, FabricConnectionSettings } from '../../services/datasource.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  templateUrl: './settings.page.html',
  imports: [FormsModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonText],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPage implements OnInit {
  private readonly datasourceService = inject(DatasourceService);

  protected statusMessage = 'IT configuration for Fabric Lakehouse, storage, and agent runtime.';
  protected settings: FabricConnectionSettings = {
    workspaceId: '',
    capacityId: '',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    storageContainer: '',
    storageConnectionString: ''
  };

  ngOnInit(): void {
    this.datasourceService.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
      },
      error: () => {
        this.settings = { ...this.settings };
      }
    });
  }

  protected saveSettings(): void {
    this.datasourceService.saveSettings(this.settings).subscribe({
      next: (settings) => {
        this.settings = settings;
        this.statusMessage = 'Connection settings saved.';
      },
      error: () => {
        this.statusMessage = 'Configuration saved locally. API unavailable.';
      }
    });
  }
}
