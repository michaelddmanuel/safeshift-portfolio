import type { ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { cn } from '../lib/utils';

type Variant = 'brand' | 'outline' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  isDisabled?: boolean;
  className?: string;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ' +
  'transition focus:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 ' +
  'data-[focus-visible]:ring-brand data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed';

const variants: Record<Variant, string> = {
  brand:
    'bg-brand-gradient text-brand-contrast shadow-lg shadow-brand/25 hover:-translate-y-0.5 hover:opacity-95',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:border-brand hover:bg-brand-soft',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

export function Button({
  children,
  onPress,
  type = 'button',
  variant = 'brand',
  isDisabled,
  className,
}: ButtonProps) {
  return (
    <AriaButton
      type={type}
      onPress={onPress}
      isDisabled={isDisabled}
      className={cn(base, variants[variant], className)}
    >
      {children}
    </AriaButton>
  );
}
