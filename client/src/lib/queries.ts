import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  certApi,
  dashboardApi,
  incidentApi,
  toolboxApi,
  trainingApi,
  userApi,
  type IncidentUpdate,
} from '../api/endpoints';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../components/Toast';
import type { NewIncident, NewUser, UpdateUser } from '../types';

/** Pull a human-readable message out of an Axios error, else fall back. */
function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { error?: string } } })?.response?.data;
  return typeof data?.error === 'string' && data.error ? data.error : fallback;
}

/** Active tenant slug — part of every query key so switching brand refetches. */
function useScope(): string {
  const { activeTenant } = useTenant();
  return activeTenant?.slug ?? 'platform';
}

export function useDashboard() {
  const scope = useScope();
  return useQuery({ queryKey: ['dashboard', scope], queryFn: dashboardApi.get });
}

export function useCertifications() {
  const scope = useScope();
  return useQuery({ queryKey: ['certifications', scope], queryFn: certApi.list });
}

export function useCertSummary() {
  const scope = useScope();
  return useQuery({ queryKey: ['certSummary', scope], queryFn: certApi.summary });
}

export function useTrainings() {
  const scope = useScope();
  return useQuery({ queryKey: ['trainings', scope], queryFn: trainingApi.list });
}

export function useToolboxTalks() {
  const scope = useScope();
  return useQuery({ queryKey: ['toolboxTalks', scope], queryFn: toolboxApi.list });
}

export function useUsers() {
  const scope = useScope();
  return useQuery({ queryKey: ['users', scope], queryFn: userApi.list });
}

export function useCreateUser() {
  const scope = useScope();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (body: NewUser) => userApi.create(body),
    onSuccess: (user) => {
      toast.success(`${user.fullName} added to the workforce`);
      void qc.invalidateQueries({ queryKey: ['users', scope] });
      void qc.invalidateQueries({ queryKey: ['dashboard', scope] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not add user.')),
  });
}

export function useUpdateUser() {
  const scope = useScope();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUser }) => userApi.update(id, body),
    onSuccess: (user) => {
      toast.success(`${user.fullName} updated`);
      void qc.invalidateQueries({ queryKey: ['users', scope] });
      void qc.invalidateQueries({ queryKey: ['dashboard', scope] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update user.')),
  });
}

export function useSetUserActive() {
  const scope = useScope();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? userApi.update(id, { isActive: true }) : userApi.remove(id),
    onSuccess: (_data, { isActive }) => {
      toast.success(isActive ? 'User reactivated' : 'User deactivated');
      void qc.invalidateQueries({ queryKey: ['users', scope] });
      void qc.invalidateQueries({ queryKey: ['dashboard', scope] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update user status.')),
  });
}

export function useIncidents() {
  const scope = useScope();
  return useQuery({ queryKey: ['incidents', scope], queryFn: incidentApi.list });
}

export function useIncidentSummary() {
  const scope = useScope();
  return useQuery({ queryKey: ['incidentSummary', scope], queryFn: incidentApi.summary });
}

export function useCreateIncident() {
  const scope = useScope();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (body: NewIncident) => incidentApi.create(body),
    onSuccess: () => {
      toast.success('Incident reported');
      void qc.invalidateQueries({ queryKey: ['incidents', scope] });
      void qc.invalidateQueries({ queryKey: ['incidentSummary', scope] });
    },
    onError: () => toast.error('Could not report incident. Please try again.'),
  });
}

export function useUpdateIncident() {
  const scope = useScope();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: IncidentUpdate }) => incidentApi.update(id, body),
    onSuccess: () => {
      toast.success('Investigation updated');
      void qc.invalidateQueries({ queryKey: ['incidents', scope] });
      void qc.invalidateQueries({ queryKey: ['incidentSummary', scope] });
    },
    onError: () => toast.error('Could not update incident.'),
  });
}

export function useAttendTraining() {
  const scope = useScope();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => trainingApi.attend(id),
    onSuccess: () => {
      toast.success('Signed in to training');
      void qc.invalidateQueries({ queryKey: ['trainings', scope] });
      void qc.invalidateQueries({ queryKey: ['dashboard', scope] });
    },
    onError: () => toast.error('Could not sign in. Please try again.'),
  });
}

export function useSigninToolbox() {
  const scope = useScope();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => toolboxApi.signin(id),
    onSuccess: () => {
      toast.success('Signed in to toolbox talk');
      void qc.invalidateQueries({ queryKey: ['toolboxTalks', scope] });
    },
    onError: () => toast.error('Could not sign in. Please try again.'),
  });
}

export function useRunCertScan() {
  const scope = useScope();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: () => certApi.scan(),
    onSuccess: (data: { result: { scanned: number; updated: number; alertsSent: number } }) => {
      const r = data.result;
      toast.success(`Scan complete — ${r.scanned} checked, ${r.updated} updated, ${r.alertsSent} alert(s)`);
      void qc.invalidateQueries({ queryKey: ['certifications', scope] });
      void qc.invalidateQueries({ queryKey: ['certSummary', scope] });
      void qc.invalidateQueries({ queryKey: ['dashboard', scope] });
    },
    onError: () => toast.error('Expiry scan failed.'),
  });
}
