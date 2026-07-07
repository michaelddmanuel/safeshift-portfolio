import { twMerge } from 'tailwind-merge';
import clsx, { type ClassValue } from 'clsx';
import type { Role } from '../types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const ROLE_LABELS: Record<Role, string> = {
  platform_admin: 'Platform admin',
  hse_manager: 'HSE manager',
  supervisor: 'Supervisor',
  worker: 'Worker',
  contractor: 'Contractor',
  auditor: 'Auditor',
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  // US format MM/DD/YYYY (§7).
  return new Date(value).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
