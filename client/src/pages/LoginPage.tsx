import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenantApi } from '../api/endpoints';
import { IS_DEMO } from '../api/client';
import { applyBrandTheme } from '../lib/theme';
import { AuthBackground } from '../components/AuthBackground';
import { BrandLogo, BrandMark, HexMark, ShieldMark } from '../components/Logo';
import type { Tenant } from '../types';

const DEMO_PASSWORD = 'Passw0rd!';

const BRAND_DEMO_EMAIL: Record<string, string> = {
  shell: 'hse@shell.safeshift.app',
  exxon: 'hse@exxon.safeshift.app',
  chevron: 'hse@chevron.safeshift.app',
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@safeshift.app');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [brands, setBrands] = useState<Tenant[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    tenantApi.list().then(setBrands).catch(() => undefined);
    return () => applyBrandTheme(null);
  }, []);

  const selected = useMemo(
    () => brands.find((b) => b.slug === selectedSlug) ?? null,
    [brands, selectedSlug],
  );
  const floatingSlug = selected?.slug ?? null;

  function pickBrand(slug: string | null) {
    setSelectedSlug(slug);
    setError(null);
    if (slug) {
      const t = brands.find((b) => b.slug === slug);
      applyBrandTheme(t?.theme ?? null, slug);
      setEmail(BRAND_DEMO_EMAIL[slug] ?? 'admin@safeshift.app');
    } else {
      applyBrandTheme(null);
      setEmail('admin@safeshift.app');
    }
    setPassword(DEMO_PASSWORD);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/');
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        'Sign in failed';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const roleAccounts = selected ? brandRoleAccounts(selected.slug) : PLATFORM_ACCOUNTS;

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-white lg:grid-cols-[1.1fr_0.9fr]">
      <AuthBackground />

      <section className="auth-hero-panel relative z-10 hidden border-r border-black/10 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <div className="auth-foreground-orb auth-foreground-orb-a anim-float" />
          <div className="auth-foreground-orb auth-foreground-orb-b anim-float" />
          <div className="auth-foreground-ring auth-foreground-ring-a anim-molecule" />
          <div className="auth-foreground-ring auth-foreground-ring-b anim-molecule" />
          <div className="absolute bottom-[20%] right-[30%] opacity-30">
            <HexMark size={84} className="anim-molecule" />
          </div>
          {floatingSlug && (
            <>
              <div className="auth-floating-logo auth-floating-logo-shell anim-float">
                <BrandLogo slug={floatingSlug} variant="icon" height={24} className="w-auto object-contain" />
              </div>
              <div className="auth-floating-logo auth-floating-logo-exxon anim-float">
                <BrandLogo slug={floatingSlug} variant="icon" height={22} className="w-auto object-contain" />
              </div>
              <div className="auth-floating-logo auth-floating-logo-chevron anim-float">
                <BrandLogo slug={floatingSlug} variant="icon" height={23} className="w-auto object-contain" />
              </div>
            </>
          )}
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] shadow-sm">
            <ShieldMark size={18} primary="white" secondary="rgba(255,255,255,0.7)" />
            SafeShift Intelligence
          </div>
          <h2 className="mt-6 max-w-lg text-5xl font-bold leading-tight tracking-tight">
            HSE visibility that teams actually use.
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/80">
            Multi-tenant command center for certifications, training readiness, toolbox talks, and audit posture.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile title="Live readiness" value="94%" />
          <InfoTile title="Open actions" value="12" />
          <InfoTile title="Tracked workers" value="3.2k" />
        </div>

        <div className="grid max-w-md grid-cols-3 gap-3">
          <BrandSwatch
            slug="shell"
            label="Shell"
            active={selectedSlug === 'shell'}
            onClick={() => pickBrand('shell')}
          />
          <BrandSwatch
            slug="exxon"
            label="ExxonMobil"
            active={selectedSlug === 'exxon'}
            onClick={() => pickBrand('exxon')}
          />
          <BrandSwatch
            slug="chevron"
            label="Chevron"
            active={selectedSlug === 'chevron'}
            onClick={() => pickBrand('chevron')}
          />
        </div>
        </div>
      </section>

      <section className="relative z-10 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
      <div className="anim-slide-in w-full max-w-md overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur">
        {/* Brand top bar */}
        <div className="brand-transition h-2 w-full bg-brand-gradient" />

        <div className="px-8 py-9">
          {/* Logo */}
          <div className="flex flex-col items-center text-center">
            {selected ? (
              <BrandMark slug={selected.slug} size={72} radius={18} chrome="plain" />
            ) : (
              <ShieldMark size={56} style={{ filter: 'drop-shadow(0 6px 14px rgba(15,23,42,0.18))' }} />
            )}
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              SafeShift{selected ? <span className="text-brand"> {selected.theme.logoText}</span> : ''}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {selected ? selected.safetyProgramLabels.programName : 'HSE Training & Compliance'}
            </p>
            <div className="mt-3 flex items-center gap-2 text-slate-300">
              <HexMark size={18} />
              <HexMark size={22} />
              <HexMark size={18} />
            </div>
          </div>

          {/* Brand picker */}
          <div className="mt-6">
            <div className="flex flex-wrap justify-center gap-2">
              <BrandChip label="Platform" active={selectedSlug === null} onClick={() => pickBrand(null)} />
              {brands.map((b) => (
                <BrandChip
                  key={b.slug}
                  label={b.theme.logoText}
                  color={b.theme.primary}
                  swatch={b.theme.secondary}
                  active={selectedSlug === b.slug}
                  onClick={() => pickBrand(b.slug)}
                />
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="anim-slide-in" style={{ animationDelay: '0.05s' }}>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                required
              />
            </div>
            <div className="anim-slide-in" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-12 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-slate-500 hover:text-brand"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <p className="anim-slide-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="anim-slide-in" style={{ animationDelay: '0.15s' }}>
              <button
                type="submit"
                disabled={busy}
                className="anim-pulse-hover brand-transition w-full rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-brand-contrast shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Signing in…' : selected ? `Sign in to ${selected.theme.logoText}` : 'Sign in'}
              </button>
            </div>
          </form>

          {/* Demo roles */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              Demo logins {selected ? `· ${selected.theme.logoText}` : ''}
            </p>
            <div className="mt-2 grid gap-1.5">
              {roleAccounts.map((d) => (
                <button
                  key={d.email}
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 transition hover:border-brand-soft hover:bg-brand-soft"
                >
                  <span className="font-medium text-slate-800">{d.label}</span>
                  <span className="truncate pl-2 text-xs text-slate-400">{d.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SafeShift · Multi-tenant HSE platform
          </p>
          {IS_DEMO && (
            <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
              Demo mode · seeded data, no live backend
            </p>
          )}
        </div>
      </div>
      </section>
    </div>
  );
}

const PLATFORM_ACCOUNTS = [{ label: 'Platform admin', email: 'admin@safeshift.app' }];

function brandRoleAccounts(slug: string) {
  return [
    { label: 'HSE manager', email: `hse@${slug}.safeshift.app` },
    { label: 'Supervisor', email: `supervisor@${slug}.safeshift.app` },
    { label: 'Worker', email: `worker@${slug}.safeshift.app` },
    { label: 'Contractor', email: `contractor@${slug}.safeshift.app` },
  ];
}

function BrandChip({
  label,
  color,
  swatch,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  swatch?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ' +
        (active
          ? 'border-brand bg-brand-soft text-brand'
          : 'border-slate-200 text-slate-500 hover:bg-slate-50')
      }
    >
      {color ? (
        <span className="flex h-3 w-5 overflow-hidden rounded-full ring-1 ring-black/10">
          <span className="h-full w-1/2" style={{ backgroundColor: color }} />
          <span className="h-full w-1/2" style={{ backgroundColor: swatch ?? color }} />
        </span>
      ) : (
        <span className="h-3 w-3 rounded-full bg-slate-300" />
      )}
      {label}
    </button>
  );
}

function InfoTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/25 bg-slate-950/55 px-3 py-3 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">{title}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function BrandSwatch({
  slug,
  label,
  active,
  onClick,
}: {
  slug: 'shell' | 'exxon' | 'chevron';
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-xl border p-2 text-left backdrop-blur-md transition ' +
        (active
          ? 'border-white/55 bg-white/16 shadow-[0_10px_24px_-16px_rgba(15,23,42,0.8)]'
          : 'border-white/25 bg-slate-950/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/40 hover:bg-white/12')
      }
    >
      <div className="flex h-10 items-center justify-center rounded-md bg-white px-2">
        <BrandLogo slug={slug} variant="icon" height={26} className="w-auto object-contain" />
      </div>
      <p className="mt-2 text-xs font-semibold text-white/85">{label}</p>
    </button>
  );
}
