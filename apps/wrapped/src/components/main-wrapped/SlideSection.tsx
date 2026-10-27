import { usePageVisible } from '@/hooks/usePageVisible';
import { Activity, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SlideSectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  active?: boolean;
}

export function SlideSection({ id, children, className, active = true }: SlideSectionProps) {
  const pageVisible = usePageVisible();
  const [visited, setVisited] = useState(active);
  if (active && !visited) setVisited(true);
  return (
    <section
      id={id}
      data-slide-id={id}
      data-slide-active={active}
      data-slide-mounted={visited}
      className={cn(
        'h-screen w-full',
        'snap-start',
        'flex flex-col items-center justify-center',
        className
      )}
    >
      {visited && <Activity mode={active && pageVisible ? 'visible' : 'hidden'}>{children}</Activity>}
    </section>
  );
}
