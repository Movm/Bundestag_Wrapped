import type { CSSProperties } from 'react';
import { getPartyTone } from '@/lib/party-colors';

/** Party tone readable on ink, handed to the CSS as --mp-party. */
export function partyStyle(party: string): CSSProperties {
  return { '--mp-party': getPartyTone(party, 'dark') } as CSSProperties;
}
