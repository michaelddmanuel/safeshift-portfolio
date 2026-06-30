import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { applyTenantScope } from './tenantScoped';
import type { SiteType } from '../constants';

export class Site extends Model<
  InferAttributes<Site>,
  InferCreationAttributes<Site>
> {
  declare id: CreationOptional<string>;
  declare tenantId: CreationOptional<string>;
  declare name: string;
  declare type: SiteType;
  declare address: CreationOptional<string | null>;
  declare city: CreationOptional<string | null>;
  declare state: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Site.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'refinery' },
    address: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Site', tableName: 'sites' },
);

applyTenantScope(Site);
