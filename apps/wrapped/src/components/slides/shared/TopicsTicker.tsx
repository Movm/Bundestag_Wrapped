import { memo } from 'react';

interface TickerTopic { topic: string; rank: number; topParties: Array<{ party: string }>; }
interface TopicsTickerProps { topics: TickerTopic[]; }

/** Lower-ranked topics remain readable without a moving, duplicated marquee. */
export const TopicsTicker = memo(function TopicsTicker({ topics }: TopicsTickerProps) {
  if (!topics.length) return null;
  return (
    <div className="relative z-30 bg-black/40 p-4 border-t border-white/20">
      <ul className="flex flex-wrap justify-center gap-4 text-sm">
        {topics.map(item => <li key={item.topic}>
          <span className="font-semibold">#{item.rank} {item.topic}</span>
          <span className="text-white/80"> — {item.topParties.slice(0, 3).map(party => party.party).join(', ')}</span>
        </li>)}
      </ul>
    </div>
  );
});
