import type { SignatureWordMovement, YearOverYearAnalysis } from '@/generated/wrapped-contract-v1';
import { getPartyTone } from '@/lib/party-colors';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import type { TopicRiserContext } from '@/domain/topic-riser-context';
import { youthWordMeaning } from '@/domain/youth-words';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, FitWord, Lead, Mark, Note } from '@/design-system/components/Type';
import { ChipCloud, Delta, RankCard } from '@/design-system/components/Data';
import { PartyBlock, PartyGrid } from '@/design-system/components/PartyBlock';

type RankingKind = 'topics' | 'words';

const number = new Intl.NumberFormat('de-DE');

const RANK_TONES = ['white', 'violet', 'pink', 'card'] as const;

function movementName(kind: RankingKind, label: string): string {
  return kind === 'topics' ? topicName(label) : label;
}

/** "Über diese Themen wird mehr geredet": stair-stepped rank cards, biggest riser first. */
export function RankingMovementSlide({ analysis, kind }: { analysis: YearOverYearAnalysis; kind: RankingKind }) {
  const items = analysis[kind]
    .filter(item => item.previousRank !== null && item.rankChange > 0)
    .slice(0, 4);
  const isTopics = kind === 'topics';
  const year = editionSurface(useOptionalEdition()).year;
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">{isTopics
        ? 'Der Rang zeigt, wie viele Wörter in allen Reden zum Thema gehören, nicht die Zahl der Reden. Gezeigt werden Themen, die in beiden Jahren vorkommen.'
        : 'Gezeigt werden Einträge, die in beiden Jahren vorkommen und Rangplätze gewonnen haben.'}</Note>}
    >
      <div className="flex flex-col items-start gap-4">
        <Enter className="flex flex-wrap items-center gap-3">
          <Eyebrow>{analysis.baseline.editionId}{year ? ` → ${year}` : ''}</Eyebrow>
          <span className="ds-eyebrow">Rangveränderung</span>
        </Enter>
        <Display size="xl" face="wide">
          {isTopics
            ? <>Über diese Themen wird <Mark>mehr geredet.</Mark></>
            : <>Diese Wörter sind <Mark>aufgestiegen.</Mark></>}
        </Display>
      </div>
      <ol className="flex flex-col gap-3" aria-label={isTopics ? 'Aufgestiegene Themen' : 'Aufgestiegene Wörter'}>
        {items.map((item, index) => (
          <li key={item.label}>
            <RankCard
              rank={item.currentRank ?? index + 1}
              label={movementName(kind, item.label)}
              detail={`Platz ${item.previousRank} → ${item.currentRank}`}
              change={item.rankChange}
              tone={RANK_TONES[index % RANK_TONES.length]}
              step={index}
            />
          </li>
        ))}
      </ol>
    </Slide>
  );
}

function MovementBadge({ item, size = 'md' }: { item: SignatureWordMovement; size?: 'sm' | 'md' }) {
  const small = size === 'sm' ? ' ds-delta--sm' : '';
  if (item.previousRank === null) return <span className={`ds-contrast ds-delta${small}`}>Neu</span>;
  if (item.currentRank === null) return <span className={`ds-contrast ds-delta${small}`}>Raus</span>;
  return <Delta change={item.previousRank - item.currentRank} size={size} />;
}

export function SignatureWordMovementSlide({ analysis }: { analysis: YearOverYearAnalysis }) {
  const parties = analysis.signatureWords.filter(item => item.risers.length > 0 || item.fallers.length > 0);
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">„Neu“ und „Raus“: Wechsel unter den fünf auffälligsten Wörtern jeder Fraktion.</Note>}
    >
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Verglichen mit {analysis.baseline.editionId}</Eyebrow></Enter>
        <Display size="xl" face="wide">
          Typische Wörter <Mark>im Wandel.</Mark>
        </Display>
      </div>
      <PartyGrid label="Typische Wörter im Wandel je Fraktion">
        {parties.map(party => {
          const [lead, ...rest] = [...party.risers.slice(0, 2), ...party.fallers.slice(0, 2)];
          return (
            <PartyBlock key={party.party} party={party.party}>
              <div className="flex flex-col items-start gap-2">
                <FitWord word={lead.word} />
                <MovementBadge item={lead} />
              </div>
              {rest.length > 0 && (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={`Weitere Veränderungen bei ${party.party}`}>
                  {rest.map(item => (
                    <li key={item.word} lang="de" data-surface="light" className="inline-flex max-w-full items-center gap-2 rounded-full py-1 pl-3 pr-1 font-wide text-base font-extrabold">
                      <span className="min-w-0 [overflow-wrap:anywhere]">{item.word}</span>
                      <MovementBadge item={item} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </PartyBlock>
          );
        })}
      </PartyGrid>
    </Slide>
  );
}

/**
 * Everything about the youth words on one slide: the most frequent word with
 * its meaning, who said it, other hits, and the candidates that never came up.
 * The data is usually thin (a handful of hits), so it reads as text, not charts.
 */
export function YouthLanguageResultSlide({ analysis }: { analysis: YearOverYearAnalysis }) {
  const youth = analysis.youthLanguage;
  const hits = youth.words.filter(item => item.count > 0);
  const misses = youth.words.filter(item => item.count === 0).map(item => item.word);
  const top = hits[0];
  const speakers = youth.bySpeaker.slice(0, 6);
  const parties = youth.byParty.filter(item => item.party !== 'fraktionslos');
  const meaning = top ? youthWordMeaning(top.word) : undefined;
  const winnerLabel = top?.winnerYear ? `Jugendwort ${top.winnerYear}` : 'Jugendwort-Kandidat';
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Nur Treffer im passenden Zusammenhang, Zitate zählen mit · Vergleich mit {analysis.baseline.editionId}</Note>}
    >
      {top ? (
        <div className="flex flex-col items-start gap-3">
          <Enter><Eyebrow>{winnerLabel}</Eyebrow></Enter>
          <Display size="xl" face="wide">„{top.word}“ fiel <Mark>{number.format(top.count)}×</Mark> im Bundestag.</Display>
          <Lead>
            {meaning ? `${meaning} ` : ''}
            {top.previousCount === 0 ? `Im Vorjahr fiel es kein einziges Mal.` : `Im Vorjahr: ${number.format(top.previousCount)}×.`}
          </Lead>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <Display size="xl" face="wide">Kein <Mark>Jugendwort</Mark> im Bundestag.</Display>
          <Lead>Keiner der Kandidaten fiel in einer Rede.</Lead>
        </div>
      )}
      {speakers.length > 0 && (
        <div className="flex flex-col gap-3">
          <Enter as="p" className="m-0 text-base font-semibold">
            Gesagt haben es <span className="font-normal">· Das heißt nicht, dass sie das Wort gut finden.</span>
          </Enter>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Abgeordnete mit Jugendwort-Treffern">
            {speakers.map(item => (
              <Enter as="li" key={`${item.name}-${item.party}`} kind="pop">
                <span data-surface="light" className="inline-flex max-w-full flex-wrap items-baseline gap-x-2 rounded-full px-4 py-2 font-wide text-lg font-extrabold">
                  <span className="[overflow-wrap:anywhere]">{item.name}</span>
                  <span className="text-sm font-bold" style={{ color: getPartyTone(item.party, 'light') }}>{item.party}</span>
                  <span className="text-sm font-bold">{number.format(item.count)}×</span>
                </span>
              </Enter>
            ))}
          </ul>
          {parties.length > 1 && (
            <Enter as="p" className="m-0 text-base font-semibold">
              Nach Fraktion: {parties.map(item => `${item.party} ${number.format(item.count)}×`).join(' · ')}
            </Enter>
          )}
        </div>
      )}
      {hits.length > 1 && (
        <Enter className="flex flex-col items-start gap-3">
          <p className="m-0 text-base font-semibold">Auch gefallen</p>
          <ChipCloud words={hits.slice(1, 6).map(item => `${item.word} ${number.format(item.count)}×`)} label="Weitere Jugendwörter" />
        </Enter>
      )}
      {misses.length > 0 && (
        <Enter as="p" className="m-0 max-w-[40rem] text-base">
          <strong>Kam nie vor:</strong> {misses.map(word => `„${word}“`).join(', ')}.
        </Enter>
      )}
    </Slide>
  );
}

function topicName(id: string): string {
  return TOPIC_BY_ID[id]?.name ?? id;
}

const timesAverage = (ratio: number) => `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(ratio)}× so oft wie der Bundestagsschnitt`;

/** "Wo steckt Wirtschaft drin?": the words behind the topic, the party and the MPs who talk about it most. */
export function TopicRiserContextSlide({ context, baselineYear }: { context: TopicRiserContext; baselineYear: string }) {
  const { riser, parties, words, speakers } = context;
  const name = topicName(riser.label);
  const leader = parties[0];
  return (
    <Slide shapes="corner">
      <div className="flex flex-col items-start gap-3">
        <Display size="xl">Wo steckt <Mark>{name}</Mark> drin?</Display>
        <Lead>Von Platz {riser.previousRank} auf Platz {riser.currentRank} seit {baselineYear}. Diese Wörter prägen das Thema:</Lead>
      </div>
      {words.length > 0 && <ChipCloud words={words} label={`Häufigste Wörter zum Thema ${name}`} />}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      {leader && leader.vsAverage > 1 && (
        <PartyGrid label={`Fraktion, die am meisten über ${name} spricht`}>
          <PartyBlock party={leader.party}>
            <FitWord word={`${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(leader.vsAverage)}×`} />
            <p className="m-0 text-base font-semibold">so oft über {name} wie der Bundestag insgesamt</p>
          </PartyBlock>
        </PartyGrid>
      )}
      {speakers.length > 0 && (
        <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label={`Abgeordnete, die im Verhältnis am meisten über ${name} sprechen`}>
          {speakers.map((item, index) => (
            <li key={`${item.name}-${item.party}`}>
              <RankCard
                rank={index + 1}
                label={item.name}
                detail={<><span style={{ color: getPartyTone(item.party, 'light') }}>{item.party}</span> · {timesAverage(item.vsAverage)}</>}
                tone="white"
                step={index}
              />
            </li>
          ))}
        </ol>
      )}
      </div>
    </Slide>
  );
}
