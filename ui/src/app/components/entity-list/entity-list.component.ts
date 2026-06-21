import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea
} from '@ionic/angular/standalone';

import { OntologyEntity, OntologyProperty, OntologyPropertyType } from '../../models/ontology.model';

@Component({
  selector: 'app-entity-list',
  standalone: true,
  templateUrl: './entity-list.component.html',
  imports: [
    FormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTextarea
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityListComponent {
  @Input({ required: true }) entities: OntologyEntity[] = [];
  @Input() selectedEntityId?: string;
  @Output() readonly entitiesChange = new EventEmitter<OntologyEntity[]>();
  @Output() readonly selectedEntityIdChange = new EventEmitter<string>();

  protected readonly propertyTypes: OntologyPropertyType[] = ['string', 'number', 'boolean', 'date', 'reference'];

  protected get selectedEntity(): OntologyEntity | undefined {
    if (!this.entities.length) {
      return undefined;
    }

    const selected = this.entities.find((entity) => entity.id === this.selectedEntityId);
    return selected ?? this.entities[0];
  }

  protected addEntity(): void {
    const now = Date.now();
    const nextEntity: OntologyEntity = {
      id: `entity-${now}`,
      name: `Entity ${this.entities.length + 1}`,
      description: 'Describe the business concept captured by this entity.',
      properties: [this.createProperty(now)]
    };

    const next = [...this.entities, nextEntity];
    this.entitiesChange.emit(next);
    this.selectedEntityIdChange.emit(nextEntity.id);
  }

  protected selectEntity(entityId: string): void {
    this.selectedEntityIdChange.emit(entityId);
  }

  protected updateEntity(): void {
    this.entitiesChange.emit([...this.entities]);
  }

  protected removeEntity(entityId: string): void {
    const next = this.entities.filter((entity) => entity.id !== entityId);
    this.entitiesChange.emit(next);
    if (!next.length) {
      return;
    }
    if (this.selectedEntityId === entityId) {
      this.selectedEntityIdChange.emit(next[0].id);
    }
  }

  protected addProperty(): void {
    const selected = this.selectedEntity;
    if (!selected) {
      return;
    }

    selected.properties = [...selected.properties, this.createProperty(Date.now())];
    this.entitiesChange.emit([...this.entities]);
  }

  protected removeProperty(propertyId: string): void {
    const selected = this.selectedEntity;
    if (!selected) {
      return;
    }

    selected.properties = selected.properties.filter((property) => property.id !== propertyId);
    this.entitiesChange.emit([...this.entities]);
  }

  protected updateProperty(): void {
    this.entitiesChange.emit([...this.entities]);
  }

  private createProperty(seed: number): OntologyProperty {
    return {
      id: `property-${seed}`,
      name: 'new_property',
      type: 'string',
      description: 'Describe this property.'
    };
  }
}
