import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { Ontology } from '../models/ontology.model';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/ontologies`;

  submitForBinding(id: string, note?: string) {
    return this.http.post<Ontology>(`${this.baseUrl}/${id}/submit-for-binding`, { note });
  }

  submitForDeployment(id: string, note?: string) {
    return this.http.post<Ontology>(`${this.baseUrl}/${id}/submit-for-deployment`, { note });
  }

  deploy(id: string, note?: string) {
    return this.http.post<{ ontology: Ontology; fabric: unknown }>(
      `${this.baseUrl}/${id}/deploy`,
      { note }
    );
  }
}
