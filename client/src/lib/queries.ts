import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { certApi, dashboardApi, toolboxApi, trainingApi, userApi } from '../api/endpoints';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../components/Toast';

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
