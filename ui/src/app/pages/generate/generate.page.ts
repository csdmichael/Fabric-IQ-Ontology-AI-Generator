import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronUp, chevronDown } from 'ionicons/icons';
import { finalize } from 'rxjs';

import { OntologyGraphComponent } from '../../components/ontology-graph/ontology-graph.component';
import { ONTOLOGY_SAMPLE_PROMPTS, OntologySamplePrompt } from '../../config/ontology-prompts.config';
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
    IonIcon,
    IonTextarea,
    IonSpinner,
    OntologyGraphComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratePage {
  private readonly generateService = inject(GenerateService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ chevronUp, chevronDown });
  }

  protected businessCase = '';
  protected promptSummary = '';
  protected generatedOntology?: Ontology;
  protected selectedEntityId?: string;
  protected isGenerating = false;
  protected generationDurationMs?: number;
  protected samplePromptFeedback = '';
  protected showSamplePrompts = false;
  protected readonly samplePrompts: OntologySamplePrompt[] = ONTOLOGY_SAMPLE_PROMPTS;

  protected runGeneration(): void {
    if (!this.businessCase.trim()) {
      return;
    }

    const startedAt = performance.now();
    this.isGenerating = true;
    this.generatedOntology = undefined;
    this.promptSummary = '';
    this.generationDurationMs = undefined;
    this.selectedEntityId = undefined;

    this.generateService
      .generateDraft({ businessCase: this.businessCase.trim() })
      .pipe(
        finalize(() => {
          this.isGenerating = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.generatedOntology = response.ontology;
          this.promptSummary = response.promptSummary;
          this.generationDurationMs = Math.round(performance.now() - startedAt);
          this.selectedEntityId = this.generatedOntology.entities[0]?.id;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.generatedOntology = undefined;
          this.generationDurationMs = Math.round(performance.now() - startedAt);
          this.promptSummary = this.resolveGenerationError(error);
          this.cdr.markForCheck();
        }
      });
  }

  protected onSelectedEntityIdChange(entityId: string): void {
    this.selectedEntityId = entityId;
    this.cdr.markForCheck();
  }

  private resolveGenerationError(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (error instanceof HttpErrorResponse) {
      const apiMessage =
        typeof error.error === 'object' && error.error && 'message' in error.error
          ? String((error.error as { message?: string }).message ?? '')
          : '';

      if (apiMessage.trim()) {
        return apiMessage;
      }
    }

    return 'Generation service unavailable. Please try again.';
  }

  protected useSamplePrompt(prompt: string): void {
    this.businessCase = prompt;
    this.samplePromptFeedback = 'Sample prompt inserted into the text area.';
  }

  protected async copySamplePrompt(prompt: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(prompt);
      this.samplePromptFeedback = 'Sample prompt copied to clipboard. Paste it into any chat input.';
    } catch {
      this.businessCase = prompt;
      this.samplePromptFeedback = 'Clipboard access was blocked. The prompt has been inserted into the text area instead.';
    }
  }

  protected openEditor(): void {
    if (!this.generatedOntology) {
      return;
    }

    void this.router.navigate(['/ontologies/new'], { state: { ontology: this.generatedOntology } });
  }
}
