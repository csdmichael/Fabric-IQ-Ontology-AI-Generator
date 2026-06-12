import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
import { createOutline, trashOutline } from 'ionicons/icons';

import { Ontology } from '../../models/ontology.model';

@Component({
  selector: 'app-ontology-card',
  standalone: true,
  templateUrl: './ontology-card.component.html',
  imports: [DatePipe, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonButtons, IonChip, IonText, IonIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyCardComponent {
  @Input({ required: true }) ontology!: Ontology;
  @Output() readonly delete = new EventEmitter<string>();

  constructor() {
    addIcons({ createOutline, trashOutline });
  }

  protected onDelete(): void {
    this.delete.emit(this.ontology.id);
  }
}
