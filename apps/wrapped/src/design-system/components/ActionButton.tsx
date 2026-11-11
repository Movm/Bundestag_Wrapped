import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Icon = 'down' | 'right' | 'restart' | 'none';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: Icon;
  size?: 'md' | 'lg';
  /** `contrast` = filled with the surface's contrast colour; `outline` = ring in text colour. */
  variant?: 'contrast' | 'outline';
}

const PATHS: Record<Exclude<Icon, 'none'>, string> = {
  down: 'M12 5v14M5 12l7 7 7-7',
  right: 'M5 12h14M13 6l6 6-6 6',
  restart: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
};

/** Pill button (Starten, Weiter …). Readable on every surface by construction. */
export function ActionButton({ children, icon = 'down', size = 'md', variant = 'contrast', className, type = 'button', ...props }: ActionButtonProps) {
  return (
    <button type={type} className={cn('ds-button', `ds-button--${size}`, `ds-button--${variant}`, variant === 'contrast' && 'ds-contrast', className)} {...props}>
      {children}
      {icon !== 'none' && (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d={PATHS[icon]} />
        </svg>
      )}
    </button>
  );
}
