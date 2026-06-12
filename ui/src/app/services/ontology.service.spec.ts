import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Ontology } from '../models/ontology.model';
import { OntologyService } from './ontology.service';

describe('OntologyService', () => {
  let service: OntologyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OntologyService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(OntologyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads ontologies from the API', () => {
    const response: Ontology[] = [
      {
        id: 'customer-domain',
        name: 'Customer Domain',
        description: 'Tracks customer concepts',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entities: []
      }
    ];

    service.listOntologies().subscribe((ontologies) => {
      expect(ontologies).toEqual(response);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/api/ontologies`);
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });
});
