import type { Mention } from '@/generated/wrapped-contract-v1';
import { getPartyTone } from '@/lib/party-colors';
import { Slide } from '@/design-system/components/Slide';
import { Display, Lead, Mark, Note } from '@/design-system/components/Type';
import { Block, RankCard } from '@/design-system/components/Data';

const number = new Intl.NumberFormat('de-DE');
const day = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * A named moment of the year (e.g. "Timmy der Wal"): who brought it up in the
 * Bundestag, most mentions first, with the first quote of the top speaker.
 */
export function MentionSlide({ mention }: { mention: Mention }) {
  const [top] = mention.speakers;
  const words = mention.label.split(' ');
  const head = words.slice(0, -1).join(' ');
  const last = words.at(-1);
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Alle Erwähnungen in Plenarreden und Fragestunden, gezählt nach Abgeordneten.</Note>}
    >
      <div className="flex flex-col items-start gap-3">
        <Display size="xl" face="wide">{head && <>{head} </>}<Mark>{last}.</Mark></Display>
        <Lead>
          {number.format(mention.count)}× im Bundestag erwähnt, von {number.format(mention.speakers.length)} Abgeordneten.
        </Lead>
      </div>
      <Block tone="pink">
        <figure className="m-0 flex flex-col gap-3">
          <blockquote className="m-0 text-lg font-semibold leading-snug hyphens-auto" lang="de">„{top.quote}“</blockquote>
          <figcaption className="text-sm">
            <strong>{top.name}</strong> ({top.party}) · {day.format(new Date(`${top.date}T00:00:00Z`))}
          </figcaption>
        </figure>
      </Block>
      <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label={`Abgeordnete, die ${mention.label} erwähnt haben`}>
        {mention.speakers.slice(0, 5).map((item, index) => (
          <li key={`${item.name}-${item.party}`}>
            <RankCard
              rank={index + 1}
              label={item.name}
              detail={<><span style={{ color: getPartyTone(item.party, 'light') }}>{item.party}</span> · {number.format(item.count)}× erwähnt</>}
              tone="white"
              step={index}
            />
          </li>
        ))}
      </ol>
    </Slide>
  );
}
