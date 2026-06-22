import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';

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
  private readonly requestTimeoutMs = environment.generateTimeoutMs ?? 60000;

  generateDraft(request: GenerateOntologyRequest) {
    return this.http.post<GenerateOntologyResponse>(this.baseUrl, request).pipe(
      timeout(this.requestTimeoutMs),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          return throwError(
            () =>
              new Error(
                `Generation timed out after ${Math.round(this.requestTimeoutMs / 1000)} seconds. Please try a shorter prompt or retry.`
              )
          );
        }

        return throwError(() => error);
      })
    );
  }
}
