import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SECTION_CONFIG, type SectionId } from './section-config';

interface SectionWrapperProps {
  sectionId: SectionId;
  children: ReactNode;
  className?: string;
  showTopBorder?: boolean;
  noPadding?: boolean;
}

export function SectionWrapper({
  sectionId,
  children,
  className,
  showTopBorder = true,
  noPadding = false,
}: SectionWrapperProps) {
  const config = SECTION_CONFIG[sectionId];

  if (!config) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        'relative px-6',
        !noPadding && 'py-8',
        className
      )}
    >
      {showTopBorder && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8" aria-hidden="true">
          <div className="h-1 w-full rounded-full bg-wr-card" />
        </div>
      )}

      {/* Content */}
      <div className="relative max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}
