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
 * What certifications a training course grants and for how long (§11).
 * e.g. code "HAZWOPER40", validityMonths 12 → completing it issues a 1-year cert.
 */
export class CourseCatalog extends Model<
  InferAttributes<CourseCatalog>,
  InferCreationAttributes<CourseCatalog>
> {
  declare id: CreationOptional<string>;
  declare tenantId: CreationOptional<string>;
  declare code: string;
  declare name: string;
  declare category: CreationOptional<string | null>;
  /** Null = never expires. */
  declare validityMonths: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CourseCatalog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: true },
    validityMonths: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'CourseCatalog', tableName: 'course_catalog' },
);

applyTenantScope(CourseCatalog);
