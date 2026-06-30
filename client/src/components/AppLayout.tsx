import type { ComponentType, ReactNode, SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { BrandLockup } from './BrandLockup';
import { BrandToggle } from './BrandToggle';
import { IS_DEMO } from '../api/client';
import {
  HomeIcon,
  CalendarIcon,
  ClipboardIcon,
  ShieldIcon,
  FileEditIcon,
  UsersIcon,
  BarChartIcon,
} from './Icons';
import { cn } from '../lib/utils';
import type { FeatureFlag } from '../types';

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  feature?: FeatureFlag;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/trainings', label: 'Training', icon: CalendarIcon },
  { to: '/toolbox-talks', label: 'Toolbox Talks', icon: ClipboardIcon, feature: 'toolboxTalks' },
  { to: '/certifications', label: 'Certifications', icon: ShieldIcon, feature: 'certTracker' },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/trainings', label: 'Training Management', icon: FileEditIcon },
  { to: '/admin/users', label: 'User Management', icon: UsersIcon },
  { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChartIcon },
];

const ADMIN_ROLES = ['platform_admin', 'hse_manager', 'supervisor'];

/** Two-letter initials for the header avatar. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, tenant, logout } = useAuth();
  const { activeTenant, hasFeature } = useTenant();
  const labels = activeTenant?.safetyProgramLabels;

  const visibleNav = NAV.filter((item) => !item.feature || hasFeature(item.feature));
  const isAdmin = user ? ADMIN_ROLES.includes(user.role) : false;
  const workspaceName = tenant?.displayName ?? activeTenant?.displayName ?? 'Platform workspace';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-brand">
              <BrandLockup />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-400">Operations workspace</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-slate-700">{workspaceName}</p>
          </div>

          <nav className="mt-5 space-y-1">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {isAdmin && (
            <nav className="mt-6 space-y-1">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Administration
              </p>
              {ADMIN_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {labels && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Safety program</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{labels.programName}</p>
              <p className="mt-1 text-xs text-slate-500">{labels.slogan}</p>
            </div>
          )}

          <div className="mt-auto rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {initials(user?.fullName ?? '')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-slate-900">{user?.fullName}</p>
                <p className="truncate text-xs capitalize text-slate-500">{user?.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
      <header className="brand-transition sticky top-0 z-20 border-b border-slate-200 bg-white text-slate-900">
        <div className="flex items-center justify-between px-4 py-3 lg:px-7">
          <div className="text-brand lg:hidden">
            <BrandLockup />
          </div>
          <p className="hidden text-sm font-semibold text-slate-700 lg:block">{workspaceName}</p>
          <div className="flex items-center gap-4">
            {IS_DEMO && (
              <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 sm:inline">
                Demo data
              </span>
            )}
            <BrandToggle />
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 px-4 py-6 lg:px-7">
        <main className="min-w-0 flex-1">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {workspaceName}
          </div>
          {children}
        </main>
      </div>
      </div>
    </div>
  );
}
