import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { Ontology } from '../models/ontology.model';

export interface GenerateOntologyRequest {
  businessCase: string;
}

export interface GenerateOntologyResponse {
  ontology: Ontology;
  promptSummary: string;
}

@Injectable({
  providedIn: 'root'
})
export class GenerateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/generate`;

  generateDraft(request: GenerateOntologyRequest) {
    return this.http.post<GenerateOntologyResponse>(this.baseUrl, request);
  }
}
