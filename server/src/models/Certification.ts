import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { applyTenantScope } from './tenantScoped';
import { CERT_EXPIRING_WINDOW_DAYS, type CertStatus } from '../constants';

/**
 * Certification & Competency Tracker (§8.1) — the #1 quick-win module.
 * Turns "attendance" data into "are we audit-ready right now?" via expiry tracking.
 */
export class Certification extends Model<
  InferAttributes<Certification>,
  InferCreationAttributes<Certification>
> {
  declare id: CreationOptional<string>;
  declare tenantId: CreationOptional<string>;
  declare userId: string;
  declare courseCode: CreationOptional<string | null>;
  declare name: string;
  declare issuer: CreationOptional<string | null>;
  /** DATEONLY → represented as a 'YYYY-MM-DD' string by Sequelize. */
  declare issuedAt: string;
  /** Null = does not expire. */
  declare expiresAt: CreationOptional<string | null>;
  declare fileUrl: CreationOptional<string | null>;
  /** Denormalized for fast reporting; refreshed by the nightly cron (§14.7). */
  declare status: CreationOptional<CertStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Certification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    courseCode: { type: DataTypes.STRING, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    issuer: { type: DataTypes.STRING, allowNull: true },
    issuedAt: { type: DataTypes.DATEONLY, allowNull: false },
    expiresAt: { type: DataTypes.DATEONLY, allowNull: true },
    fileUrl: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Certification', tableName: 'certifications' },
);

applyTenantScope(Certification);

/** Pure helper — compute audit status from an expiry date. */
export function computeCertStatus(
  expiresAt: Date | string | null,
  now: Date = new Date(),
): CertStatus {
  if (!expiresAt) return 'active';
  const expiry = new Date(expiresAt);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysToExpiry = Math.floor((expiry.getTime() - now.getTime()) / msPerDay);
  if (daysToExpiry < 0) return 'expired';
  if (daysToExpiry <= CERT_EXPIRING_WINDOW_DAYS) return 'expiring';
  return 'active';
}

/** Days until expiry (negative = already expired, null = never expires). */
export function daysToExpiry(
  expiresAt: Date | string | null,
  now: Date = new Date(),
): number | null {
  if (!expiresAt) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(expiresAt).getTime() - now.getTime()) / msPerDay);
}
