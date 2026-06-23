import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, gitNetworkOutline, trashOutline } from 'ionicons/icons';

import { Ontology } from '../../models/ontology.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ontology-card',
  standalone: true,
  templateUrl: './ontology-card.component.html',
  imports: [DatePipe, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonButtons, IonChip, IonText, IonIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyCardComponent {
  private readonly auth = inject(AuthService);

  @Input({ required: true }) ontology!: Ontology;
  @Output() readonly delete = new EventEmitter<string>();
  @Output() readonly bind = new EventEmitter<Ontology>();

  protected get canBind(): boolean {
    return this.auth.hasAnyPermission('ontology:bind-data', 'agent:ontology-data-binder');
  }

  constructor() {
    addIcons({ createOutline, gitNetworkOutline, trashOutline });
  }

  protected onDelete(): void {
    this.delete.emit(this.ontology.id);
  }

  protected onBind(): void {
    this.bind.emit(this.ontology);
  }
}
