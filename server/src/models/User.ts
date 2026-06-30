import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { applyTenantScope } from './tenantScoped';
import { ROLES, type Role } from '../constants';

export class User extends Model<
  InferAttributes<User, { omit: 'fullName' }>,
  InferCreationAttributes<User, { omit: 'fullName' }>
> {
  declare id: CreationOptional<string>;
  /** Null only for platform_admin, who operates across tenants. */
  declare tenantId: CreationOptional<string | null>;
  declare email: string;
  declare passwordHash: string;
  declare firstName: string;
  declare lastName: string;
  declare role: Role;
  declare employeeId: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare isContractor: CreationOptional<boolean>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  async verifyPassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
  }

  static async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: ROLES.WORKER },
    employeeId: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    isContractor: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'User', tableName: 'users' },
);

// Auto-scope user queries to the active tenant. Safe because:
//  - login looks users up before any tenant context is established (no scope),
//  - platform_admin requests run with `bypassTenantScope` (cross-tenant reach),
//  - seeding runs unscoped and sets tenantId explicitly.
applyTenantScope(User);
