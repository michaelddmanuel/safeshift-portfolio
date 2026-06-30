import { sequelize } from '../config/database';
import { Tenant } from './Tenant';
import { User } from './User';
import { Site } from './Site';
import { CourseCatalog } from './CourseCatalog';
import { Training } from './Training';
import { Attendance } from './Attendance';
import { Declaration } from './Declaration';
import { Certification } from './Certification';
import { ToolboxTalk } from './ToolboxTalk';
import { ToolboxSignin } from './ToolboxSignin';

// ── Tenant ownership (every domain row belongs to one tenant) ──────────────
Tenant.hasMany(User, { foreignKey: 'tenantId' });
User.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(Site, { foreignKey: 'tenantId' });
Site.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(Training, { foreignKey: 'tenantId' });
Training.belongsTo(Tenant, { foreignKey: 'tenantId' });

// ── Training / attendance ──────────────────────────────────────────────────
Site.hasMany(Training, { foreignKey: 'siteId' });
Training.belongsTo(Site, { foreignKey: 'siteId' });

Training.hasMany(Attendance, { foreignKey: 'trainingId', as: 'attendances' });
Attendance.belongsTo(Training, { foreignKey: 'trainingId', as: 'training' });

User.hasMany(Attendance, { foreignKey: 'userId', as: 'attendances' });
Attendance.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Attendance.belongsTo(User, { foreignKey: 'verifiedById', as: 'verifier' });

// ── Declarations ───────────────────────────────────────────────────────────
User.hasMany(Declaration, { foreignKey: 'userId', as: 'declarations' });
Declaration.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Certifications ─────────────────────────────────────────────────────────
User.hasMany(Certification, { foreignKey: 'userId', as: 'certifications' });
Certification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Toolbox Talks ──────────────────────────────────────────────────────────
Tenant.hasMany(ToolboxTalk, { foreignKey: 'tenantId' });
ToolboxTalk.belongsTo(Tenant, { foreignKey: 'tenantId' });

Site.hasMany(ToolboxTalk, { foreignKey: 'siteId' });
ToolboxTalk.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });

ToolboxTalk.hasMany(ToolboxSignin, { foreignKey: 'toolboxTalkId', as: 'signins' });
ToolboxSignin.belongsTo(ToolboxTalk, { foreignKey: 'toolboxTalkId', as: 'toolboxTalk' });

User.hasMany(ToolboxSignin, { foreignKey: 'userId', as: 'toolboxSignins' });
ToolboxSignin.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  sequelize,
  Tenant,
  User,
  Site,
  CourseCatalog,
  Training,
  Attendance,
  Declaration,
  Certification,
  ToolboxTalk,
  ToolboxSignin,
};
