import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/** Flat placeholder block; no pulse or shimmer. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('bg-wr-card rounded-xl', className)} aria-hidden="true" />;
}

export function SkeletonShimmer({ className }: SkeletonProps) {
  return <Skeleton className={className} />;
}
