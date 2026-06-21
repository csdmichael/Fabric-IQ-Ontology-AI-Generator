import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText } from '@ionic/angular/standalone';

import { Ontology } from '../../models/ontology.model';

@Component({
  selector: 'app-ontology-graph',
  standalone: true,
  templateUrl: './ontology-graph.component.html',
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyGraphComponent {
  @Input({ required: true }) ontology!: Ontology;
  @Input() selectedEntityId?: string;
  @Output() readonly selectedEntityIdChange = new EventEmitter<string>();

  protected readonly math = Math;

  protected nodeX(index: number): number {
    return 120 + ((index % 4) * 190);
  }

  protected nodeY(index: number): number {
    return 90 + (Math.floor(index / 4) * 130);
  }

  protected selectEntity(entityId: string): void {
    this.selectedEntityIdChange.emit(entityId);
  }

  protected entityIndex(entityId: string): number {
    return this.ontology.entities.findIndex((entity) => entity.id === entityId);
  }
}
