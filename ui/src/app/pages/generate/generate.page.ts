import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonText,
  IonTextarea
} from '@ionic/angular/standalone';

import { Ontology } from '../../models/ontology.model';
import { GenerateService } from '../../services/generate.service';

@Component({
  selector: 'app-generate-page',
  standalone: true,
  templateUrl: './generate.page.html',
  imports: [FormsModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonTextarea, IonText],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratePage {
  private readonly generateService = inject(GenerateService);
  private readonly router = inject(Router);

  protected businessCase = 'Our retail team needs a customer and order ontology mapped to lakehouse sales tables and customer support views.';
  protected promptSummary = '';
  protected generatedOntology?: Ontology;
  protected isGenerating = false;

  protected runGeneration(): void {
    if (!this.businessCase.trim()) {
      return;
    }

    this.isGenerating = true;
    this.generateService.generateDraft({ businessCase: this.businessCase.trim() }).subscribe({
      next: (response) => {
        this.generatedOntology = response.ontology;
        this.promptSummary = response.promptSummary;
        this.isGenerating = false;
      },
      error: () => {
        this.generatedOntology = undefined;
        this.promptSummary = 'Generation service unavailable.';
        this.isGenerating = false;
      }
    });
  }

  protected openEditor(): void {
    if (!this.generatedOntology) {
      return;
    }

    void this.router.navigate(['/ontologies/new'], { state: { ontology: this.generatedOntology } });
  }
}
