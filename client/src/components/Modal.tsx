import type { ReactNode } from 'react';
import { Dialog, Heading, Modal as AriaModal, ModalOverlay } from 'react-aria-components';
import { cn } from '../lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

interface ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: ModalSize;
  /** Render prop receives `close` so buttons inside can dismiss the dialog. */
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Sticky footer (e.g. Save/Cancel). Also receives `close`. */
  footer?: ReactNode | ((close: () => void) => ReactNode);
}

/**
 * Accessible, brand-styled modal built on react-aria-components (focus trap,
 * Esc-to-close, scroll locking, backdrop dismiss). Shared by the certification
 * detail popup and the user add/edit forms.
 */
export function Modal({
  isOpen,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className="fixed inset-0 z-50 flex min-h-full items-end justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
    >
      <AriaModal
        className={cn(
          'anim-slide-in w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl',
          SIZES[size],
        )}
      >
        <Dialog className="outline-none" aria-label={typeof title === 'string' ? title : 'Dialog'}>
          {({ close }) => (
            <div className="flex max-h-[85vh] flex-col">
              {(title || description) && (
                <div className="relative border-b border-slate-100 px-6 py-4">
                  {title && (
                    <Heading slot="title" className="pr-8 text-lg font-semibold text-slate-900">
                      {title}
                    </Heading>
                  )}
                  {description && <p className="mt-1 pr-8 text-sm text-slate-500">{description}</p>}
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={close}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {typeof children === 'function' ? children(close) : children}
              </div>
              {footer && (
                <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                  {typeof footer === 'function' ? footer(close) : footer}
                </div>
              )}
            </div>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
