import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { applyTenantScope } from './tenantScoped';
import type { AttendanceMethod } from '../constants';

/**
 * Toolbox Talk Sign-in — who attended and how they checked in.
 */
export class ToolboxSignin extends Model<
  InferAttributes<ToolboxSignin>,
  InferCreationAttributes<ToolboxSignin>
> {
  declare id: CreationOptional<string>;
  declare tenantId: CreationOptional<string>;
  declare toolboxTalkId: string;
  declare userId: string;
  declare method: CreationOptional<AttendanceMethod>;
  declare signedInAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ToolboxSignin.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    toolboxTalkId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'manual',
      validate: { isIn: [['qr-code', 'manual', 'virtual']] },
    },
    signedInAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'ToolboxSignin', tableName: 'toolbox_signins' },
);

applyTenantScope(ToolboxSignin);
