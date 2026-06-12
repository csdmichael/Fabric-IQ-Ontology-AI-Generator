import request from 'supertest';

import { app } from '../index';

describe('GET /api/health', () => {
  it('returns a healthy response', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('fabric-iq-api');
  });
});
