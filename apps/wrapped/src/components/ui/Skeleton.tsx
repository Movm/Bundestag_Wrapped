import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/** Flat placeholder block; no pulse or shimmer. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('bg-wr-card rounded-xl', className)} aria-hidden="true" />;
}

/**
 * Placeholder block with a compositor-only shimmer (src/cover/skeleton.css,
 * inlined in index.html). Its colour follows the surrounding text colour.
 */
export function SkeletonShimmer({ className }: SkeletonProps) {
  return <div className={cn('bt-skel-block rounded-xl', className)} aria-hidden="true" />;
}

/** Announces the loading state once; the blocks inside stay hidden from assistive tech. */
export function SkeletonStatus({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <div role="status" aria-label={label} className={className}>{children}</div>;
}
