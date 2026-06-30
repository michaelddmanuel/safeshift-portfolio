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
 * Reused Sasol `Declaration` model (§8.3): workers attest to Life-Saving Rules /
 * OIMS / OE Tenets, policies, or JSAs — captured with signature + IP + user-agent
 * audit trail. `kind` keys the per-brand sign-off vocabulary.
 */
export class Declaration extends Model<
  InferAttributes<Declaration>,
  InferCreationAttributes<Declaration>
> {
  declare id: CreationOptional<string>;
  declare tenantId: CreationOptional<string>;
  declare userId: string;
  declare kind: string;
  declare title: string;
  declare content: CreationOptional<string | null>;
  declare signature: string;
  declare ipAddress: CreationOptional<string | null>;
  declare userAgent: CreationOptional<string | null>;
  declare isCompliant: CreationOptional<boolean>;
  declare signedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Declaration.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    kind: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
    signature: { type: DataTypes.STRING, allowNull: false },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
    userAgent: { type: DataTypes.STRING, allowNull: true },
    isCompliant: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    signedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Declaration', tableName: 'declarations' },
);

applyTenantScope(Declaration);
