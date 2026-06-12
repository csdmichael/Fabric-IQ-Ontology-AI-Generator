import { OpenAiService } from './openai.service';

describe('OpenAiService', () => {
  it('creates a generated ontology from a business case', async () => {
    const service = new OpenAiService();

    const result = await service.generateOntologyDraft('Model customer orders and related products for retail analytics.');

    expect(result.ontology.status).toBe('generated');
    expect(result.ontology.entities.length).toBeGreaterThan(1);
    expect(result.promptSummary).toContain('Generated with');
  });
});
