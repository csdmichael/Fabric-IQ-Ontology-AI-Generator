import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTextarea
} from '@ionic/angular/standalone';

import { OntologyEntity } from '../../models/ontology.model';

@Component({
  selector: 'app-entity-list',
  standalone: true,
  templateUrl: './entity-list.component.html',
  imports: [FormsModule, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonInput, IonItem, IonLabel, IonList, IonTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityListComponent {
  @Input({ required: true }) entities: OntologyEntity[] = [];
  @Output() readonly entitiesChange = new EventEmitter<OntologyEntity[]>();

  protected addEntity(): void {
    const nextEntity: OntologyEntity = {
      id: `entity-${Date.now()}`,
      name: `Entity ${this.entities.length + 1}`,
      description: 'Describe the business concept captured by this entity.',
      properties: []
    };

    this.entitiesChange.emit([...this.entities, nextEntity]);
  }

  protected removeEntity(id: string): void {
    this.entitiesChange.emit(this.entities.filter((entity) => entity.id !== id));
  }

  protected updateEntity(): void {
    this.entitiesChange.emit([...this.entities]);
  }
}
