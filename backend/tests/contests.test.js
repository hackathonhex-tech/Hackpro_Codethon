import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './setup.js';
import { env } from '../src/config/env.js';

describe('Contests & Live Extension', () => {
  let app;
  let adminToken;
  let sampleContestId;

  beforeAll(async () => {
    app = createApp();
    await setupTestDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: env.SUPER_ADMIN_EMAIL,
        password: env.SUPER_ADMIN_PASSWORD,
      });

    adminToken = loginRes.body.data.accessToken;
  });

  it('should list all contests with permissions', async () => {
    const res = await request(app)
      .get('/api/v1/contests')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    sampleContestId = res.body.data[0].id;
  });

  it('should adjust contest timing and extend live duration', async () => {
    const res = await request(app)
      .post(`/api/v1/contests/${sampleContestId}/timing`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        extensionMinutes: 15,
        reason: 'Network fluctuation grace window',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalExtensionMinutes).toBeGreaterThanOrEqual(15);
  });
});
