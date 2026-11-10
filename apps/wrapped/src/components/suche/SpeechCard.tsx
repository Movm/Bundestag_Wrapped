import { memo, useMemo } from 'react';
import { PARTY_BG_CLASSES } from '@/lib/party-colors';
import { highlightTerms, type ScoredSpeech, type ParsedQuery } from '@/lib/search-utils';
import { CategoryBadge } from '@/components/ui/SpeechTypeBadge';

interface SpeechCardProps {
  speech: ScoredSpeech;
  query: ParsedQuery;
  onClick: (speech: ScoredSpeech) => void;
}

export const SpeechCard = memo(function SpeechCard({ speech, query, onClick }: SpeechCardProps) {
  const highlightedPreview = useMemo(
    () => highlightTerms(speech.preview || speech.text, query, 150),
    [speech.preview, speech.text, query]
  );

  return (
    <button
      onClick={event => { event.currentTarget.focus(); onClick(speech); }}
      className="w-full text-left bg-wr-card hover:bg-bg-elevated border border-track rounded-xl p-4 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-on font-medium">{speech.speaker}</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium text-on ${
              PARTY_BG_CLASSES[speech.party] || 'bg-gray-500'
            }`}
          >
            {speech.party}
          </span>
          <CategoryBadge category={speech.category} size="sm" />
        </div>
        <span className="text-on-muted text-sm whitespace-nowrap">
          {speech.words.toLocaleString('de-DE')} Wörter
        </span>
      </div>
      <p className="text-on-muted text-sm leading-relaxed line-clamp-2 group-hover:text-on transition-colors">
        "{highlightedPreview}"
      </p>
    </button>
  );
});
