export type Role =
  | 'platform_admin'
  | 'hse_manager'
  | 'supervisor'
  | 'worker'
  | 'contractor'
  | 'auditor';

export type FeatureFlag =
  | 'certTracker'
  | 'toolboxTalks'
  | 'incidentReporting'
  | 'stopWorkAuthority'
  | 'safetyObservations'
  | 'permitToWork'
  | 'contractorCompliance'
  | 'sdsLibrary'
  | 'auditsInspections'
  | 'fleetGarageSafety'
  | 'emergencyDrills';

export type FeatureMap = Record<FeatureFlag, boolean>;

export interface TenantTheme {
  logoText: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface SafetyProgramLabels {
  signOff: string;
  programName: string;
  slogan: string;
}

export interface Tenant {
  id: string;
  slug: string;
  displayName: string;
  theme: TenantTheme;
  features: FeatureMap;
  safetyProgramLabels: SafetyProgramLabels;
}

export interface User {
  id: string;
  tenantId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  employeeId: string | null;
  phone: string | null;
  isContractor: boolean;
  isActive: boolean;
}

export type CertStatus = 'active' | 'expiring' | 'expired';

export interface Certification {
  id: string;
  userId: string;
  courseCode: string | null;
  name: string;
  issuer: string | null;
  issuedAt: string;
  expiresAt: string | null;
  fileUrl: string | null;
  status: CertStatus;
  daysToExpiry: number | null;
  user?: { id: string; fullName: string; role: Role } | null;
}

export interface CertSummary {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  expiringIn30: number;
  expiringIn60: number;
  expiringIn90: number;
}

export interface Site {
  id: string;
  name: string;
  type: string;
}

export interface Training {
  id: string;
  title: string;
  description: string | null;
  courseCode: string | null;
  siteId: string | null;
  scheduledAt: string;
  location: string | null;
  isVirtual: boolean;
  meetingLink: string | null;
  capacity: number | null;
  mandatory: boolean;
  facilitator: string | null;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  Site?: Site | null;
}

export interface DashboardStats {
  workforce: number;
  upcomingTrainings: number;
  completedTrainings: number;
  certifications: number;
  certStatus: { active: number; expiring: number; expired: number };
  auditReadiness: number;
}

export interface TenantDashboard {
  scope: 'tenant';
  stats: DashboardStats;
  recentTrainings: Training[];
}

export interface PlatformDashboard {
  scope: 'platform';
  tenants: {
    slug: string;
    displayName: string;
    users: number;
    trainings: number;
    certifications: number;
  }[];
}

export type Dashboard = TenantDashboard | PlatformDashboard;

export interface ToolboxTalk {
  id: string;
  siteId: string;
  topic: string;
  description: string | null;
  scheduledAt: string;
  location: string | null;
  facilitator: string | null;
  site?: Site | null;
}

export interface ToolboxSignin {
  id: string;
  toolboxTalkId: string;
  userId: string;
  method: 'qr-code' | 'manual' | 'virtual';
  signedInAt: string;
  user?: { id: string; firstName: string; lastName: string; role: Role } | null;
}

export interface ToolboxTalkDetail extends ToolboxTalk {
  signins?: ToolboxSignin[];
}

export interface ManagedUser extends User {
  certs: { active: number; expiring: number; expired: number };
}

/** Roles a tenant admin may assign (platform_admin is provisioned out-of-band). */
export type AssignableRole = Exclude<Role, 'platform_admin'>;

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  role: AssignableRole;
  employeeId?: string;
  phone?: string;
  isContractor?: boolean;
  password?: string;
}

export type UpdateUser = Partial<Omit<NewUser, 'password'>> & { isActive?: boolean };

export interface NewTraining {
  title: string;
  description?: string;
  courseCode?: string;
  siteId?: string;
  scheduledAt: string;
  location?: string;
  isVirtual?: boolean;
  capacity?: number;
  mandatory?: boolean;
  facilitator?: string;
}

export type IncidentType =
  | 'injury'
  | 'illness'
  | 'near-miss'
  | 'property-damage'
  | 'environmental'
  | 'first-aid';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'action-pending' | 'closed';
export type OshaClassification = 'death' | 'days-away' | 'restricted' | 'other-recordable';
export type InjuryCategory =
  | 'injury'
  | 'skin-disorder'
  | 'respiratory'
  | 'poisoning'
  | 'hearing-loss'
  | 'other-illness';

export interface IncidentPerson {
  id: string;
  fullName: string;
  role: Role;
}

export interface Incident {
  id: string;
  caseNumber: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string | null;
  occurredAt: string;
  location: string | null;
  status: IncidentStatus;
  oshaRecordable: boolean;
  oshaClassification: OshaClassification | null;
  daysAway: number;
  daysRestricted: number;
  injuryCategory: InjuryCategory | null;
  bodyPart: string | null;
  rootCause: string | null;
  correctiveAction: string | null;
  site: Site | null;
  affected: IncidentPerson | null;
  reporter: IncidentPerson | null;
}

export interface IncidentSummary {
  total: number;
  recordable: number;
  open: number;
  nearMiss: number;
  daysAway: number;
  daysRestricted: number;
}

export interface NewIncident {
  type: IncidentType;
  severity?: IncidentSeverity;
  title: string;
  description?: string;
  occurredAt: string;
  location?: string;
  siteId?: string;
  affectedUserId?: string;
  oshaRecordable?: boolean;
  oshaClassification?: OshaClassification;
  daysAway?: number;
  daysRestricted?: number;
  injuryCategory?: InjuryCategory;
  bodyPart?: string;
}
