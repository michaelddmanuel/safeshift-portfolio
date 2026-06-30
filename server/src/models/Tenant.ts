import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import type { FeatureMap } from '../constants';

export interface TenantTheme {
  logoText: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface SafetyProgramLabels {
  /** e.g. "Life-Saving Rules acknowledgement" vs "OIMS attestation" vs "OE / Tenets sign-off". */
  signOff: string;
  programName: string;
  slogan: string;
}

/**
 * A tenant = one brand (Shell / ExxonMobil / Chevron) defined by config, not code (§5.1).
 * NOT tenant-scoped itself — it is the scoping anchor.
 */
export class Tenant extends Model<
  InferAttributes<Tenant>,
  InferCreationAttributes<Tenant>
> {
  declare id: CreationOptional<string>;
  declare slug: string;
  declare displayName: string;
  declare theme: TenantTheme;
  declare features: FeatureMap;
  declare safetyProgramLabels: SafetyProgramLabels;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Tenant.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    displayName: { type: DataTypes.STRING, allowNull: false },
    theme: { type: DataTypes.JSONB, allowNull: false },
    features: { type: DataTypes.JSONB, allowNull: false },
    safetyProgramLabels: { type: DataTypes.JSONB, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Tenant', tableName: 'tenants' },
);
