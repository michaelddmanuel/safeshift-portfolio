import { Select, SelectValue, Button, Popover, ListBox, ListBoxItem } from 'react-aria-components';
import type { Key } from 'react-aria-components';
import { useTenant } from '../context/TenantContext';

/**
 * 3-way brand toggle (§5.3, §6). Platform admins / demo mode flip the active
 * brand live; the theme swaps via TenantContext with zero component changes.
 */
export function BrandToggle() {
  const { availableTenants, activeTenant, canSwitchBrand, switchBrand } = useTenant();
  if (!canSwitchBrand) return null;

  return (
    <Select
      aria-label="Active brand"
      selectedKey={activeTenant?.slug ?? null}
      onSelectionChange={(key: Key | null) => {
        if (key != null) switchBrand(String(key));
      }}
    >
      <Button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm data-[focus-visible]:ring-2 data-[focus-visible]:ring-slate-300">
        <span className="h-2.5 w-2.5 rounded-full bg-brand" />
        <SelectValue>{activeTenant?.displayName ?? 'Select brand'}</SelectValue>
        <span aria-hidden className="text-xs text-slate-400">▾</span>
      </Button>
      <Popover className="w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
        <ListBox className="p-1 outline-none">
          {availableTenants.map((t) => (
            <ListBoxItem
              key={t.slug}
              id={t.slug}
              textValue={t.displayName}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 outline-none data-[focused]:bg-slate-100 data-[selected]:font-semibold"
            >
              <span
                className="h-3 w-3 rounded-full ring-1 ring-slate-300"
                style={{ backgroundColor: t.theme.primary }}
              />
              {t.displayName}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}
