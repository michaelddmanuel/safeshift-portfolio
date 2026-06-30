import { useTenant } from '../context/TenantContext';
import { BrandLogo, ShieldMark } from './Logo';

/** SafeShift {Brand} lockup (§6) — the SafeShift shield beside the tenant name. */
export function BrandLockup({ compact = false }: { compact?: boolean }) {
  const { activeTenant } = useTenant();
  const slug = activeTenant?.slug;

  if (slug) {
    return (
      <div className="flex items-center">
        <BrandLogo
          slug={slug}
          variant="wordmark"
          height={compact ? 20 : 26}
          className="max-h-7 w-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/25 shadow-sm">
        <ShieldMark size={24} primary="currentColor" secondary="rgba(255,255,255,0.6)" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight">SafeShift</span>
      )}
    </div>
  );
}
