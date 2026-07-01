import { getPartyColor } from '@/lib/party-colors';

interface PartyBadgeProps {
  party: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled';
  className?: string;
}

export function PartyBadge({ party, size = 'md', variant = 'outline', className = '' }: PartyBadgeProps) {
  const color = getPartyColor(party);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const style = variant === 'filled'
    ? { backgroundColor: color, color: '#ffffff' }
    : { backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={style}
    >
      {party}
    </span>
  );
}
