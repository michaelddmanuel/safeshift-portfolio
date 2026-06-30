import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { applyTenantScope } from './tenantScoped';
import type {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  OshaClassification,
  InjuryCategory,
} from '../constants';

/**
 * Incident & Investigation (§8) — near-miss through recordable injury/illness.
 * Carries the fields needed to auto-build the OSHA 300 Log (29 CFR 1904):
 * classification (J–M), days away/restricted, and injury category.
 */
export class Incident extends Model<
  InferAttributes<Incident>,
  InferCreationAttributes<Incident>
> {
  declare id: CreationOptional<string>;
  declare tenantId: CreationOptional<string>;
  declare caseNumber: string;
  declare siteId: CreationOptional<string | null>;
  declare reportedById: string;
  declare affectedUserId: CreationOptional<string | null>;
  declare type: IncidentType;
  declare severity: IncidentSeverity;
  declare title: string;
  declare description: CreationOptional<string | null>;
  declare occurredAt: Date;
  declare location: CreationOptional<string | null>;
  declare status: CreationOptional<IncidentStatus>;
  /** OSHA 1904 recordability. */
  declare oshaRecordable: CreationOptional<boolean>;
  declare oshaClassification: CreationOptional<OshaClassification | null>;
  declare daysAway: CreationOptional<number>;
  declare daysRestricted: CreationOptional<number>;
  declare injuryCategory: CreationOptional<InjuryCategory | null>;
  declare bodyPart: CreationOptional<string | null>;
  /** Investigation / CAPA. */
  declare rootCause: CreationOptional<string | null>;
  declare correctiveAction: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Incident.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    caseNumber: { type: DataTypes.STRING, allowNull: false },
    siteId: { type: DataTypes.UUID, allowNull: true },
    reportedById: { type: DataTypes.UUID, allowNull: false },
    affectedUserId: { type: DataTypes.UUID, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: false },
    severity: { type: DataTypes.STRING, allowNull: false, defaultValue: 'low' },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'open' },
    oshaRecordable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    oshaClassification: { type: DataTypes.STRING, allowNull: true },
    daysAway: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    daysRestricted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    injuryCategory: { type: DataTypes.STRING, allowNull: true },
    bodyPart: { type: DataTypes.STRING, allowNull: true },
    rootCause: { type: DataTypes.TEXT, allowNull: true },
    correctiveAction: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Incident', tableName: 'incidents' },
);

applyTenantScope(Incident);
