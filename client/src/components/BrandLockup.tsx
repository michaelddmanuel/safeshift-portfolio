import { useTenant } from '../context/TenantContext';
import { BrandMark, ShieldMark } from './Logo';

/** SafeShift {Brand} lockup (§6) — a single, uniform per-tenant brand mark. */
export function BrandLockup({ compact = false }: { compact?: boolean }) {
  const { activeTenant } = useTenant();
  const slug = activeTenant?.slug;

  if (slug) {
    return (
      <div className="flex items-center">
        <BrandMark slug={slug} size={compact ? 30 : 40} radius={12} chrome="plain" />
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
