import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonSpinner,
  IonTextarea
} from '@ionic/angular/standalone';

import { Ontology } from '../../models/ontology.model';
import { GenerateService } from '../../services/generate.service';

@Component({
  selector: 'app-generate-page',
  standalone: true,
  templateUrl: './generate.page.html',
  styleUrls: ['./generate.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonTextarea,
    IonSpinner
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratePage {
  private readonly generateService = inject(GenerateService);
  private readonly router = inject(Router);

  protected businessCase = '';
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
        this.promptSummary = 'Generation service unavailable. Please try again.';
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
