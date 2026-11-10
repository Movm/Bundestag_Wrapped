import { getPartyTone } from '@/lib/party-colors';

interface PartyBadgeProps {
  party: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled';
  className?: string;
}

/** Party pill: flat plate in the party tone (readable on ink), or an outline. */
export function PartyBadge({ party, size = 'md', variant = 'outline', className = '' }: PartyBadgeProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const tone = getPartyTone(party, 'dark');
  const style =
    variant === 'filled'
      ? { backgroundColor: tone, color: 'var(--color-wr-ink)' }
      : { color: tone, border: `2px solid ${tone}` };

  return (
    <span
      className={`inline-flex items-center rounded-full font-wide font-bold ${sizeClasses[size]} ${className}`}
      style={style}
    >
      {party}
    </span>
  );
}
