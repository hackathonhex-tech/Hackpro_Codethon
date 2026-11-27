import apiClient from './apiClient';

export const authApi = {
  login: async (identifier: string, password: string) => {
    const res = await apiClient.post('/auth/login', { identifier, password });
    return res.data.data;
  },

  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data.data.user;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  refresh: async () => {
    const res = await apiClient.post('/auth/refresh');
    return res.data.data;
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await apiClient.post('/auth/reset-password', { token, newPassword });
    return res.data.data;
  },
};

export const contestApi = {
  joinBatch: async (batchCode: string) => {
    const res = await apiClient.post('/student/contests/join-batch', { batchCode });
    return res.data.data;
  },

  getAssigned: async () => {
    const res = await apiClient.get('/student/contests');
    return res.data.data;
  },

  getContest: async (contestId: string) => {
    const res = await apiClient.get(`/student/contests/${contestId}`);
    return res.data.data;
  },

  startAttempt: async (contestId: string) => {
    const res = await apiClient.post(`/student/contests/${contestId}/start`);
    return res.data.data;
  },

  getAttemptState: async (contestId: string) => {
    const res = await apiClient.get(`/student/contests/${contestId}/state`);
    return res.data.data;
  },

  saveAnswer: async (
    contestId: string,
    payload: {
      questionId: string;
      selectedOptions?: string[];
      isMarkedForReview?: boolean;
      draftCode?: string;
      language?: string;
    }
  ) => {
    const res = await apiClient.post(`/student/contests/${contestId}/answers`, payload);
    return res.data.data;
  },

  runCode: async (
    contestId: string,
    payload: { questionId: string; code: string; language: string; customInput?: string }
  ) => {
    const res = await apiClient.post(`/student/contests/${contestId}/run`, payload, { timeout: 45000 });
    return res.data.data;
  },

  submitCode: async (
    contestId: string,
    payload: { questionId: string; code: string; language: string }
  ) => {
    const res = await apiClient.post(`/student/contests/${contestId}/submit-code`, payload, { timeout: 45000 });
    return res.data.data;
  },

  finishAttempt: async (contestId: string) => {
    const res = await apiClient.post(`/student/contests/${contestId}/finish`, {
      reason: 'user_submit',
    });
    return res.data.data;
  },
};

export const leaderboardApi = {
  get: async (contestId: string) => {
    const res = await apiClient.get(`/leaderboard/${contestId}`);
    return res.data.data;
  },
};

export const proctorApi = {
  logEvent: async (payload: {
    contestId: string;
    attemptId: string;
    type: string;
    details?: Record<string, any>;
  }) => {
    const res = await apiClient.post('/proctor/events', payload);
    return res.data.data;
  },
};
