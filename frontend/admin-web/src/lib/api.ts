import apiClient from './apiClient';

export const adminAuthApi = {
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
};

export const contestsApi = {
  list: async (params?: { status?: string; page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get('/contests', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/contests/${id}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/contests', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/contests/${id}`, data);
    return res.data.data;
  },
  adjustTiming: async (id: string, extensionMinutes: number, reason: string) => {
    const res = await apiClient.post(`/contests/${id}/timing`, { extensionMinutes, reason });
    return res.data.data;
  },
  duplicate: async (id: string) => {
    const res = await apiClient.post(`/contests/${id}/duplicate`);
    return res.data.data;
  },
  toggleStatus: async (id: string, isTurnedOff: boolean) => {
    const res = await apiClient.patch(`/contests/${id}/toggle-status`, { isTurnedOff });
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/contests/${id}`);
  },
};

export const participantsApi = {
  list: async (params?: { search?: string; page?: number; limit?: number; teamId?: string }) => {
    const res = await apiClient.get('/participants', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/participants/${id}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/participants', data);
    return res.data.data;
  },
  importCsv: async (csv: string) => {
    const res = await apiClient.post('/participants/import', { csv }, { timeout: 180000 });
    return res.data.data;
  },
  exportCsv: async () => {
    const res = await apiClient.get('/participants/export', { responseType: 'blob' });
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/participants/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/participants/${id}`);
  },
  deleteAll: async () => {
    const res = await apiClient.delete('/participants/all');
    return res.data.data;
  },
};

export const teamsApi = {
  list: async () => {
    const res = await apiClient.get('/teams');
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/teams', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/teams/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/teams/${id}`);
  },
};

export const assignmentsApi = {
  getByContest: async (contestId: string) => {
    const res = await apiClient.get(`/assignments/${contestId}`);
    return res.data.data;
  },
  assign: async (contestId: string, participantIds: string[], teamIds: string[]) => {
    const res = await apiClient.post('/assignments/assign', { contestId, participantIds, teamIds });
    return res.data.data;
  },
  unassign: async (contestId: string, participantId?: string, teamId?: string) => {
    const res = await apiClient.post('/assignments/unassign', { contestId, participantId, teamId });
    return res.data.data;
  },
};

export const sectionsApi = {
  getByContest: async (contestId: string) => {
    const res = await apiClient.get(`/sections/contest/${contestId}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/sections', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/sections/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/sections/${id}`);
  },
};

export const questionsApi = {
  getByContest: async (contestId: string) => {
    const res = await apiClient.get(`/questions/contest/${contestId}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/questions', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/questions/${id}`, data);
    return res.data.data;
  },
  toggleDisplayFields: async (id: string, toggles: Record<string, boolean>) => {
    const res = await apiClient.patch(`/questions/${id}/toggles`, toggles);
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/questions/${id}`);
  },
};

export const rubricsApi = {
  list: async () => {
    const res = await apiClient.get('/rubrics');
    return res.data.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/rubrics/${id}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/rubrics', data);
    return res.data.data;
  },
  clone: async (id: string, name?: string) => {
    const res = await apiClient.post(`/rubrics/${id}/clone`, { name });
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/rubrics/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/rubrics/${id}`);
  },
};

export const invitationsApi = {
  getStatus: async (contestId: string) => {
    const res = await apiClient.get(`/contests/${contestId}/invitations`);
    return res.data.data;
  },
  send: async (contestId: string, participantIds?: string[]) => {
    const res = await apiClient.post(`/contests/${contestId}/invitations/send`, { participantIds });
    return res.data;
  },
  resendFailed: async (contestId: string) => {
    const res = await apiClient.post(`/contests/${contestId}/invitations/resend-failed`);
    return res.data;
  },
};

export const attendanceApi = {
  getByContest: async (contestId: string, params?: any) => {
    const res = await apiClient.get(`/attendance/${contestId}`, { params });
    return res.data.data;
  },
  exportCsv: async (contestId: string) => {
    const res = await apiClient.get(`/attendance/${contestId}/export`, { responseType: 'blob' });
    return res.data;
  },
  mark: async (contestId: string, userId: string, status: string) => {
    const res = await apiClient.post(`/attendance/${contestId}/mark`, { userId, status });
    return res.data.data;
  },
};

export const proctoringApi = {
  getFeed: async (contestId: string) => {
    const res = await apiClient.get('/proctor/feed', { params: { contestId } });
    return res.data.data;
  },
  getAttemptEvents: async (attemptId: string) => {
    const res = await apiClient.get(`/proctor/attempt/${attemptId}`);
    return res.data.data;
  },
};

export const leaderboardApi = {
  get: async (contestId: string) => {
    const res = await apiClient.get(`/leaderboard/${contestId}`);
    return res.data.data;
  },
};

export const analyticsApi = {
  getDashboard: async (contestId?: string) => {
    const res = await apiClient.get('/analytics/dashboard', { params: { contestId } });
    return res.data.data;
  },
  exportCsv: async (contestId?: string) => {
    const res = await apiClient.get('/analytics/export', { params: { contestId }, responseType: 'blob' });
    return res.data;
  },
};

export const reportsApi = {
  get: async (contestId: string) => {
    const res = await apiClient.get(`/reports/${contestId}`);
    return res.data.data;
  },
  updateOverrides: async (contestId: string, overrides: any, note?: string) => {
    const res = await apiClient.post(`/reports/${contestId}/override`, { overrides, note });
    return res.data.data;
  },
  reset: async (contestId: string) => {
    const res = await apiClient.post(`/reports/${contestId}/reset`);
    return res.data.data;
  },
  exportCsv: async (contestId: string) => {
    const res = await apiClient.get(`/reports/${contestId}/export`, { responseType: 'blob' });
    return res.data;
  },
};

export const submissionsApi = {
  getLocked: async (params?: { contestId?: string; search?: string; page?: number; limit?: number } | string) => {
    const query = typeof params === 'string' ? { contestId: params } : params;
    const res = await apiClient.get('/submissions', { params: query });
    return res.data;
  },
  revoke: async (payload: { attemptId: string; reason: string; extensionMinutes?: number; resetAnswers?: boolean }) => {
    const res = await apiClient.post('/submissions/revoke', payload);
    return res.data.data;
  },
};

export const usersApi = {
  list: async (params?: any) => {
    const res = await apiClient.get('/users', { params });
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/users', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/users/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/users/${id}`);
  },
};

export const rolesApi = {
  list: async () => {
    const res = await apiClient.get('/roles');
    return res.data.data;
  },
  getPermissions: async () => {
    const res = await apiClient.get('/roles/permissions');
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/roles', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/roles/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/roles/${id}`);
  },
};

export const auditLogsApi = {
  list: async (limit = 100) => {
    const res = await apiClient.get('/audit-logs', { params: { limit } });
    return res.data.data;
  },
};
