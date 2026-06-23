import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { Ontology } from '../models/ontology.model';

export interface AutoBindResult {
  ontology: Ontology;
  connection: { id: string; name: string; type: string; workspaceId: string; itemName: string };
  agent: { key: string; reply: string; delivered: boolean };
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/ontologies`;

  autoBind(id: string, connectionId: string, guidance?: string) {
    return this.http.post<AutoBindResult>(`${this.baseUrl}/${id}/auto-bind`, { connectionId, guidance });
  }

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
