import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { applyTenantScope } from './tenantScoped';
import type { AttendanceMethod, AttendanceStatus } from '../constants';

export class Attendance extends Model<
  InferAttributes<Attendance>,
  InferCreationAttributes<Attendance>
> {
  declare id: CreationOptional<string>;
  declare tenantId: CreationOptional<string>;
  declare trainingId: string;
  declare userId: string;
  declare status: CreationOptional<AttendanceStatus>;
  declare method: CreationOptional<AttendanceMethod>;
  declare checkInAt: CreationOptional<Date | null>;
  declare checkOutAt: CreationOptional<Date | null>;
  declare verifiedById: CreationOptional<string | null>;
  declare verifiedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Attendance.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    trainingId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'registered' },
    method: { type: DataTypes.STRING, allowNull: false, defaultValue: 'manual' },
    checkInAt: { type: DataTypes.DATE, allowNull: true },
    checkOutAt: { type: DataTypes.DATE, allowNull: true },
    verifiedById: { type: DataTypes.UUID, allowNull: true },
    verifiedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Attendance', tableName: 'attendances' },
);

applyTenantScope(Attendance);
