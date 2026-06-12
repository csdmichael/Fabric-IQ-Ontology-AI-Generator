import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { HomePage } from './home.page';
import { OntologyService } from '../../services/ontology.service';

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: OntologyService,
          useValue: {
            listOntologies: () => of([])
          }
        }
      ]
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(HomePage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the workflow heading', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Recommended workflow');
  });
});
