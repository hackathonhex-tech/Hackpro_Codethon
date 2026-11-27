import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './setup.js';
import { env } from '../src/config/env.js';

describe('Auth Module & RBAC', () => {
  let app;

  beforeAll(async () => {
    app = createApp();
    await setupTestDatabase();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully log in Super Admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: env.SUPER_ADMIN_EMAIL,
          password: env.SUPER_ADMIN_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(env.SUPER_ADMIN_EMAIL.toLowerCase());
      expect(res.body.data.user.role).toBe('super_admin');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should successfully log in Student with roll number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'CS2026001',
          password: env.DEFAULT_STUDENT_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.rollNumber).toBe('CS2026001');
      expect(res.body.data.user.role).toBe('student');
    });

    it('should reject invalid credentials with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: env.SUPER_ADMIN_EMAIL,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/v1/auth/refresh (Rotation)', () => {
    it('should rotate refresh token and issue new token pair', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: env.SUPER_ADMIN_EMAIL,
          password: env.SUPER_ADMIN_PASSWORD,
        });

      const cookies = loginRes.headers['set-cookie'];
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='));
      const refreshToken = refreshCookie.split(';')[0].split('=')[1];

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken}`]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toBeDefined();

      // Ensure old refresh token cannot be reused
      const replayRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken}`]);

      expect(replayRes.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return authenticated user profile and permissions', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: env.SUPER_ADMIN_EMAIL,
          password: env.SUPER_ADMIN_PASSWORD,
        });

      const token = loginRes.body.data.accessToken;

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe(env.SUPER_ADMIN_EMAIL.toLowerCase());
      expect(meRes.body.data.user.permissions.length).toBeGreaterThan(0);
    });
  });
});
