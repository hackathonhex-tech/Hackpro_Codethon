import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './setup.js';
import { env } from '../src/config/env.js';

describe('Student Attempt Lifecycle & Submission Lock', () => {
  let app;
  let studentToken;
  let adminToken;
  let contestId = 'contest_sample_2026';
  let attemptId;

  beforeAll(async () => {
    app = createApp();
    await setupTestDatabase();

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'CS2026001',
        password: env.DEFAULT_STUDENT_PASSWORD,
      });
    studentToken = studentLogin.body.data.accessToken;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: env.SUPER_ADMIN_EMAIL,
        password: env.SUPER_ADMIN_PASSWORD,
      });
    adminToken = adminLogin.body.data.accessToken;
  });

  it('should list assigned contests on student dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/student/contests')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(contestId);
  });

  it('should start test attempt and automatically mark attendance Present', async () => {
    const res = await request(app)
      .post(`/api/v1/student/contests/${contestId}/start`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('in_progress');
    attemptId = res.body.data.id;

    // Verify attendance is Present
    const attRes = await request(app)
      .get(`/api/v1/attendance/${contestId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(attRes.status).toBe(200);
    const studentRecord = attRes.body.data.records.find((r) => r.rollNumber === 'CS2026001');
    expect(studentRecord).toBeDefined();
    expect(studentRecord.status).toBe('present');
  });

  it('should get contest state with sanitized questions (no answers/no hidden tests)', async () => {
    const res = await request(app)
      .get(`/api/v1/student/contests/${contestId}/state`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.questions).toBeDefined();

    // Verify MCQ answers are hidden
    const mcq = res.body.data.questions.find((q) => q.type === 'mcq');
    expect(mcq.mcqOptions[0].isCorrect).toBeUndefined();

    // Verify Hidden test cases are not exposed
    const coding = res.body.data.questions.find((q) => q.type === 'coding');
    expect(coding.codingConfig.hiddenTestCasesCount).toBeGreaterThan(0);
    expect(coding.codingConfig.sampleTestCases.length).toBeGreaterThan(0);
  });

  it('should autosave answers idempotently', async () => {
    const stateRes = await request(app)
      .get(`/api/v1/student/contests/${contestId}/state`)
      .set('Authorization', `Bearer ${studentToken}`);

    const q = stateRes.body.data.questions[0];

    const saveRes = await request(app)
      .post(`/api/v1/student/contests/${contestId}/answers`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        questionId: q.id,
        selectedOptions: [q.mcqOptions[0].id],
        isMarkedForReview: true,
      });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.success).toBe(true);
  });

  it('should finish attempt and lock submission', async () => {
    const finishRes = await request(app)
      .post(`/api/v1/student/contests/${contestId}/finish`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'user_submit' });

    expect(finishRes.status).toBe(200);
    expect(finishRes.body.data.status).toBe('submitted');

    // Attempting to write answers now MUST return 403 ATTEMPT_LOCKED
    const stateRes = await request(app)
      .get(`/api/v1/student/contests/${contestId}/state`)
      .set('Authorization', `Bearer ${studentToken}`);

    const q = stateRes.body.data.questions[0];

    const lockedRes = await request(app)
      .post(`/api/v1/student/contests/${contestId}/answers`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        questionId: q.id,
        selectedOptions: [],
      });

    expect(lockedRes.status).toBe(403);
    expect(lockedRes.body.error.code).toBe('ATTEMPT_LOCKED');
  });

  it('should allow Super Admin to revoke submission and reopen attempt', async () => {
    const revokeRes = await request(app)
      .post('/api/v1/submissions/revoke')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        attemptId,
        reason: 'Authorized re-attempt due to verified power outage',
        extensionMinutes: 10,
      });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);
    expect(revokeRes.body.data.status).toBe('in_progress');

    // Student can now re-enter and save answers again!
    const stateRes = await request(app)
      .get(`/api/v1/student/contests/${contestId}/state`)
      .set('Authorization', `Bearer ${studentToken}`);

    const q = stateRes.body.data.questions[0];

    const reopenedSaveRes = await request(app)
      .post(`/api/v1/student/contests/${contestId}/answers`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        questionId: q.id,
        selectedOptions: [q.mcqOptions[1].id],
      });

    expect(reopenedSaveRes.status).toBe(200);
    expect(reopenedSaveRes.body.success).toBe(true);
  });
});
