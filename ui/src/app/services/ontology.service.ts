import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { Ontology } from '../models/ontology.model';

@Injectable({
  providedIn: 'root'
})
export class OntologyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/ontologies`;

  listOntologies() {
    return this.http.get<Ontology[]>(this.baseUrl);
  }

  getOntology(id: string) {
    return this.http.get<Ontology>(`${this.baseUrl}/${id}`);
  }

  createOntology(payload: Partial<Ontology>) {
    return this.http.post<Ontology>(this.baseUrl, payload);
  }

  updateOntology(id: string, payload: Partial<Ontology>) {
    return this.http.put<Ontology>(`${this.baseUrl}/${id}`, payload);
  }

  deleteOntology(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
