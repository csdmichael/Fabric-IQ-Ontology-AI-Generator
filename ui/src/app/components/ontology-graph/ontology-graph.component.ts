import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed } from '@angular/core';
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

  // Cache entity ID to index mapping to avoid repeated findIndex calls
  protected readonly entityIndexMap = computed(() => {
    const map = new Map<string, number>();
    this.ontology.entities.forEach((entity, index) => {
      map.set(entity.id, index);
    });
    return map;
  });

  // Memoize relationship line data to avoid recalculating on every render
  protected readonly relationshipLines = computed(() => {
    return (this.ontology.relationships ?? []).map((rel) => {
      const fromIndex = this.entityIndexMap().get(rel.fromEntityId) ?? -1;
      const toIndex = this.entityIndexMap().get(rel.toEntityId) ?? -1;
      if (fromIndex < 0 || toIndex < 0) return null;

      const x1 = this.nodeX(fromIndex) + 70;
      const y1 = this.nodeY(fromIndex);
      const x2 = this.nodeX(toIndex) - 70;
      const y2 = this.nodeY(toIndex);

      return {
        id: rel.id,
        name: rel.name,
        x1,
        y1,
        x2,
        y2,
        labelX: (x1 + x2) / 2,
        labelY: (y1 + y2) / 2 - 8
      };
    }).filter((line): line is NonNullable<typeof line> => line !== null);
  });

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
    return this.entityIndexMap().get(entityId) ?? -1;
  }
}
