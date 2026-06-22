import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText } from '@ionic/angular/standalone';

import { Ontology } from '../../models/ontology.model';

interface GraphNode {
  id: string;
  name: string;
  properties: number;
  incoming: number;
  outgoing: number;
  x: number;
  y: number;
}

interface GraphRelationship {
  id: string;
  name: string;
  cardinality: string;
  path: string;
  labelX: number;
  labelY: number;
  labelWidth: number;
}

const NODE_WIDTH = 164;
const NODE_HEIGHT = 106;
const GRID_STEP_X = 230;
const GRID_STEP_Y = 170;
const CANVAS_MIN_WIDTH = 980;
const CANVAS_MIN_HEIGHT = 420;
const BASE_X = 130;
const BASE_Y = 110;

@Component({
  selector: 'app-ontology-graph',
  standalone: true,
  templateUrl: './ontology-graph.component.html',
  styleUrls: ['./ontology-graph.component.scss'],
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyGraphComponent {
  @Input({ required: true }) ontology!: Ontology;
  @Input() selectedEntityId?: string;
  @Output() readonly selectedEntityIdChange = new EventEmitter<string>();

  protected readonly entityIndexMap = computed(() => {
    const map = new Map<string, number>();
    this.ontology.entities.forEach((entity, index) => {
      map.set(entity.id, index);
    });
    return map;
  });

  protected readonly columns = computed(() => {
    const count = Math.max(this.ontology.entities.length, 1);
    return Math.min(4, Math.max(2, Math.ceil(Math.sqrt(count))));
  });

  protected readonly canvasWidth = computed(() => {
    const width = (this.columns() - 1) * GRID_STEP_X + BASE_X * 2;
    return Math.max(CANVAS_MIN_WIDTH, width);
  });

  protected readonly canvasHeight = computed(() => {
    const rows = Math.ceil(Math.max(this.ontology.entities.length, 1) / this.columns());
    const height = (rows - 1) * GRID_STEP_Y + BASE_Y * 2;
    return Math.max(CANVAS_MIN_HEIGHT, height);
  });

  protected readonly relationshipStats = computed(() => {
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();

    (this.ontology.relationships ?? []).forEach((rel) => {
      outgoing.set(rel.fromEntityId, (outgoing.get(rel.fromEntityId) ?? 0) + 1);
      incoming.set(rel.toEntityId, (incoming.get(rel.toEntityId) ?? 0) + 1);
    });

    return { incoming, outgoing };
  });

  protected readonly graphNodes = computed<GraphNode[]>(() => {
    const { incoming, outgoing } = this.relationshipStats();
    return this.ontology.entities.map((entity, index) => ({
      id: entity.id,
      name: entity.name,
      properties: entity.properties.length,
      incoming: incoming.get(entity.id) ?? 0,
      outgoing: outgoing.get(entity.id) ?? 0,
      x: this.nodeX(index),
      y: this.nodeY(index)
    }));
  });

  protected readonly relationshipLines = computed<GraphRelationship[]>(() => {
    return (this.ontology.relationships ?? []).map((rel) => {
      const fromIndex = this.entityIndexMap().get(rel.fromEntityId) ?? -1;
      const toIndex = this.entityIndexMap().get(rel.toEntityId) ?? -1;
      if (fromIndex < 0 || toIndex < 0) {
        return null;
      }

      const from = { x: this.nodeX(fromIndex), y: this.nodeY(fromIndex) };
      const to = { x: this.nodeX(toIndex), y: this.nodeY(toIndex) };
      const anchors = this.edgeAnchors(from, to);

      const dx = anchors.x2 - anchors.x1;
      const dy = anchors.y2 - anchors.y1;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const offset = Math.max(18, Math.min(62, distance * 0.16));

      const midX = (anchors.x1 + anchors.x2) / 2;
      const midY = (anchors.y1 + anchors.y2) / 2;
      const controlX = midX + normalX * offset;
      const controlY = midY + normalY * offset;

      const labelText = rel.name.trim() || `${rel.fromEntityId} to ${rel.toEntityId}`;
      const cardinalityText = rel.cardinality.replace(/-/g, ' ');
      const labelWidth = Math.max(labelText.length * 6.4, cardinalityText.length * 5.8) + 22;

      return {
        id: rel.id,
        name: labelText,
        cardinality: cardinalityText,
        path: `M ${anchors.x1} ${anchors.y1} Q ${controlX} ${controlY} ${anchors.x2} ${anchors.y2}`,
        labelX: controlX,
        labelY: controlY,
        labelWidth
      };
    }).filter((line): line is NonNullable<typeof line> => line !== null);
  });

  protected nodeX(index: number): number {
    return BASE_X + ((index % this.columns()) * GRID_STEP_X);
  }

  protected nodeY(index: number): number {
    return BASE_Y + (Math.floor(index / this.columns()) * GRID_STEP_Y);
  }

  protected nodeTranslate(node: GraphNode): string {
    return `translate(${node.x - NODE_WIDTH / 2},${node.y - NODE_HEIGHT / 2})`;
  }

  protected onNodeKeyDown(event: KeyboardEvent, entityId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectEntity(entityId);
    }
  }

  protected selectEntity(entityId: string): void {
    this.selectedEntityIdChange.emit(entityId);
  }

  private edgeAnchors(from: { x: number; y: number }, to: { x: number; y: number }): { x1: number; y1: number; x2: number; y2: number } {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx >= 0) {
        return {
          x1: from.x + NODE_WIDTH / 2,
          y1: from.y,
          x2: to.x - NODE_WIDTH / 2,
          y2: to.y
        };
      }

      return {
        x1: from.x - NODE_WIDTH / 2,
        y1: from.y,
        x2: to.x + NODE_WIDTH / 2,
        y2: to.y
      };
    }

    if (dy >= 0) {
      return {
        x1: from.x,
        y1: from.y + NODE_HEIGHT / 2,
        x2: to.x,
        y2: to.y - NODE_HEIGHT / 2
      };
    }

    return {
      x1: from.x,
      y1: from.y - NODE_HEIGHT / 2,
      x2: to.x,
      y2: to.y + NODE_HEIGHT / 2
    };
  }
}
