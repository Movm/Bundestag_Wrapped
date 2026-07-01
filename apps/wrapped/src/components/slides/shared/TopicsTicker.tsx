import { memo } from 'react';
import { getPartyBgColor } from '@/lib/party-colors';

interface TickerTopic {
  topic: string;
  rank: number;
  topParties: Array<{ party: string }>;
}

interface TopicsTickerProps {
  topics: TickerTopic[];
}

const TickerContent = memo(function TickerContent({
  topics,
}: {
  topics: TickerTopic[];
}) {
  return (
    <>
      {topics.map((item, idx) => (
        <div key={`${item.topic}-${idx}`} className="flex items-center gap-3 px-4">
          <span className="text-white/60 font-bold text-sm">#{item.rank}</span>
          <span className="text-white font-semibold text-sm whitespace-nowrap">
            {item.topic}
          </span>
          <div className="flex items-center gap-1">
            {item.topParties.slice(0, 3).map((p, i) => (
              <div
                key={p.party}
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: getPartyBgColor(p.party) }}
                title={`${i + 1}. ${p.party}`}
              />
            ))}
          </div>
          {idx < topics.length - 1 && (
            <span className="text-white/20 mx-2">|</span>
          )}
        </div>
      ))}
    </>
  );
});

export const TopicsTicker = memo(function TopicsTicker({
  topics,
}: TopicsTickerProps) {
  if (topics.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 overflow-hidden">
      <div className="bg-black/40 backdrop-blur-sm py-2 border-t border-white/10">
        <div
          className="flex items-center animate-ticker"
          style={{
            width: 'max-content',
            willChange: 'transform',
          }}
        >
          <TickerContent topics={topics} />
          <TickerContent topics={topics} />
        </div>
      </div>
    </div>
  );
});
