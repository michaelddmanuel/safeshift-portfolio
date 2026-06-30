import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { applyTenantScope } from './tenantScoped';
import type { TrainingStatus } from '../constants';

export class Training extends Model<
  InferAttributes<Training>,
  InferCreationAttributes<Training>
> {
  declare id: CreationOptional<string>;
  declare tenantId: CreationOptional<string>;
  declare title: string;
  declare description: CreationOptional<string | null>;
  /** Links to CourseCatalog.code so completion can issue a cert. */
  declare courseCode: CreationOptional<string | null>;
  declare siteId: CreationOptional<string | null>;
  declare scheduledAt: Date;
  declare location: CreationOptional<string | null>;
  declare isVirtual: CreationOptional<boolean>;
  declare meetingLink: CreationOptional<string | null>;
  declare capacity: CreationOptional<number | null>;
  declare mandatory: CreationOptional<boolean>;
  declare facilitator: CreationOptional<string | null>;
  declare status: CreationOptional<TrainingStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Training.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    courseCode: { type: DataTypes.STRING, allowNull: true },
    siteId: { type: DataTypes.UUID, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: true },
    isVirtual: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    meetingLink: { type: DataTypes.STRING, allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    mandatory: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    facilitator: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'scheduled' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Training', tableName: 'trainings' },
);

applyTenantScope(Training);
