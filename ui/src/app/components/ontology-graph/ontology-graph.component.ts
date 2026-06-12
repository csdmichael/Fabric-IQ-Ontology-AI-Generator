import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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

  protected readonly math = Math;
}
