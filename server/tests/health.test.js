
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('ResolveIT API health check', () => {
  it('returns HTTP 200 and confirms the API is running', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'ResolveIT API',
    });
  });
});
