import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SlideSectionProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SlideSection({ id, children, className }: SlideSectionProps) {
  return (
    <section
      id={id}
      data-slide-id={id}
      className={cn(
        'min-h-dvh w-full',
        'snap-start snap-always',
        'flex flex-col items-center justify-center',
        className
      )}
    >
      {children}
    </section>
  );
}
