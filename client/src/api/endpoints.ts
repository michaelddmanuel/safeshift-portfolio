import { api } from './client';
import type {
  Certification,
  CertSummary,
  Dashboard,
  ManagedUser,
  NewTraining,
  Tenant,
  Training,
  ToolboxTalk,
  ToolboxTalkDetail,
  User,
} from '../types';

export interface AuthResponse {
  token: string;
  user: User;
  tenant: Tenant | null;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get<{ user: User; tenant: Tenant | null }>('/auth/me').then((r) => r.data),
};

export const tenantApi = {
  list: () => api.get<{ tenants: Tenant[] }>('/tenants').then((r) => r.data.tenants),
};

export const dashboardApi = {
  get: () => api.get<Dashboard>('/dashboard').then((r) => r.data),
};

export const trainingApi = {
  list: () => api.get<{ trainings: Training[] }>('/trainings').then((r) => r.data.trainings),
  attend: (id: string, method = 'self-declared') =>
    api.post(`/trainings/${id}/attend`, { method }).then((r) => r.data),
  create: (body: NewTraining) =>
    api.post<{ training: Training }>('/trainings', body).then((r) => r.data.training),
};

export const userApi = {
  list: () => api.get<{ users: ManagedUser[] }>('/users').then((r) => r.data.users),
};

export const certApi = {
  list: () =>
    api.get<{ certifications: Certification[] }>('/certifications').then((r) => r.data.certifications),
  summary: () => api.get<{ summary: CertSummary }>('/certifications/summary').then((r) => r.data.summary),
  scan: () => api.post('/certifications/scan').then((r) => r.data),
};

export const toolboxApi = {
  list: () => api.get<{ talks: ToolboxTalk[] }>('/toolbox-talks').then((r) => r.data.talks),
  get: (id: string) =>
    api.get<{ talk: ToolboxTalkDetail }>(`/toolbox-talks/${id}`).then((r) => r.data.talk),
  signin: (id: string, method = 'manual') =>
    api.post(`/toolbox-talks/${id}/signin`, { method }).then((r) => r.data),
};
