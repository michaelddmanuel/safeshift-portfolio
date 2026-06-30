/** US oil & gas role set (§12) — replaces Sasol's admin/esd_admin/vendor. */
export const ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  HSE_MANAGER: 'hse_manager',
  SUPERVISOR: 'supervisor',
  WORKER: 'worker',
  CONTRACTOR: 'contractor',
  AUDITOR: 'auditor',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);

/** Roles with administrative reach over a tenant's HSE program. */
export const TENANT_ADMIN_ROLES: Role[] = [ROLES.HSE_MANAGER, ROLES.SUPERVISOR];

/** Feature flags (§5.4). The keys are the contract shared with the frontend. */
export const FEATURE_FLAGS = [
  'certTracker',
  'toolboxTalks',
  'incidentReporting',
  'stopWorkAuthority',
  'safetyObservations',
  'permitToWork',
  'contractorCompliance',
  'sdsLibrary',
  'auditsInspections',
  'fleetGarageSafety',
  'emergencyDrills',
] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export type FeatureMap = Record<FeatureFlag, boolean>;

export const SITE_TYPES = ['refinery', 'terminal', 'field', 'yard', 'station'] as const;
export type SiteType = (typeof SITE_TYPES)[number];

export const ATTENDANCE_METHODS = ['qr-code', 'manual', 'virtual', 'self-declared'] as const;
export type AttendanceMethod = (typeof ATTENDANCE_METHODS)[number];

export const ATTENDANCE_STATUSES = ['registered', 'present', 'absent', 'late'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const TRAINING_STATUSES = ['scheduled', 'in-progress', 'completed', 'cancelled'] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export const CERT_STATUSES = ['active', 'expiring', 'expired'] as const;
export type CertStatus = (typeof CERT_STATUSES)[number];

/** Days-to-expiry threshold under which a cert is flagged "expiring". */
export const CERT_EXPIRING_WINDOW_DAYS = 60;

/** Incident & investigation (§8.x) — OSHA 1904 recordkeeping vocabulary. */
export const INCIDENT_TYPES = [
  'injury',
  'illness',
  'near-miss',
  'property-damage',
  'environmental',
  'first-aid',
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = ['open', 'investigating', 'action-pending', 'closed'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

/** OSHA 300 Log columns (J–M): how a recordable case is classified. */
export const OSHA_CLASSIFICATIONS = ['death', 'days-away', 'restricted', 'other-recordable'] as const;
export type OshaClassification = (typeof OSHA_CLASSIFICATIONS)[number];

/** OSHA 300 injury/illness category (columns M(1)–M(6)). */
export const INJURY_CATEGORIES = [
  'injury',
  'skin-disorder',
  'respiratory',
  'poisoning',
  'hearing-loss',
  'other-illness',
] as const;
export type InjuryCategory = (typeof INJURY_CATEGORIES)[number];
