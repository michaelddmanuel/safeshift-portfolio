import type { Tenant } from './models/Tenant';
import type { User } from './models/User';
import type { Certification } from './models/Certification';
import { computeCertStatus, daysToExpiry } from './models/Certification';

export function publicTenant(tenant: Tenant) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    displayName: tenant.displayName,
    theme: tenant.theme,
    features: tenant.features,
    safetyProgramLabels: tenant.safetyProgramLabels,
  };
}

export function publicUser(user: User) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    employeeId: user.employeeId,
    phone: user.phone,
    isContractor: user.isContractor,
    isActive: user.isActive,
  };
}

export function publicCertification(cert: Certification, now: Date = new Date()) {
  return {
    id: cert.id,
    userId: cert.userId,
    courseCode: cert.courseCode,
    name: cert.name,
    issuer: cert.issuer,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt,
    fileUrl: cert.fileUrl,
    status: computeCertStatus(cert.expiresAt, now),
    daysToExpiry: daysToExpiry(cert.expiresAt, now),
  };
}
