import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { applyTenantScope } from './tenantScoped';

/**
 * Toolbox Talks / Tailgate Meetings (§8.2)
 * Daily pre-shift safety briefings with digital sign-in (QR or tap).
 */
export class ToolboxTalk extends Model<
  InferAttributes<ToolboxTalk>,
  InferCreationAttributes<ToolboxTalk>
> {
  declare id: CreationOptional<string>;
  declare tenantId: CreationOptional<string>;
  declare siteId: string;
  declare topic: string;
  declare description: CreationOptional<string | null>;
  declare scheduledAt: Date;
  declare location: CreationOptional<string | null>;
  declare facilitator: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ToolboxTalk.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    siteId: { type: DataTypes.UUID, allowNull: false },
    topic: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: true },
    facilitator: { type: DataTypes.STRING, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'ToolboxTalk', tableName: 'toolbox_talks' },
);

applyTenantScope(ToolboxTalk);
