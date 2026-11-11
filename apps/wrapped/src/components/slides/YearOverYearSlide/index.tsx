import type { SignatureWordMovement, YearOverYearAnalysis } from '@/generated/wrapped-contract-v1';
import { getPartyTone } from '@/lib/party-colors';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import type { TopicRiserContext } from '@/domain/topic-riser-context';
import type { YouthGeneration } from '@/domain/youth-words';
import { atParty, capitalize, cardinal, times } from '@/lib/german-count';
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

/** Same gain for every shown topic ("Alle drei gewinnen einen Platz …"), otherwise a neutral line. */
function topicRisersFooter(items: ReadonlyArray<{ rankChange: number }>): string {
  const gain = items[0]?.rankChange ?? 0;
  if (items.length > 1 && items.every(item => item.rankChange === gain)) {
    const places = gain === 1 ? 'einen Platz' : `${cardinal(gain)} Plätze`;
    return `${items.length === 2 ? 'Beide' : `Alle ${cardinal(items.length)}`} gewinnen ${places} in unserer Themenrangliste.`;
  }
  return 'Gezeigt werden Themen, die in beiden Jahren in unserer Themenrangliste stehen.';
}

/** "Drei Themen rücken nach vorn": stair-stepped rank cards, biggest riser first. */
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
        ? topicRisersFooter(items)
        : 'Gezeigt werden Einträge, die in beiden Jahren vorkommen und Rangplätze gewonnen haben.'}</Note>}
    >
      <div className="flex flex-col items-start gap-4">
        <Enter className="flex flex-wrap items-center gap-3">
          <Eyebrow>{analysis.baseline.editionId}{year ? ` → ${year}` : ''}</Eyebrow>
          {!isTopics && <span className="ds-eyebrow">Rangveränderung</span>}
        </Enter>
        <Display size="xl" face="wide">
          {isTopics
            ? <>{items.length === 1 ? 'Ein Thema rückt' : `${capitalize(cardinal(items.length))} Themen rücken`} <Mark>nach vorn.</Mark></>
            : <>Diese Wörter sind <Mark>aufgestiegen.</Mark></>}
        </Display>
      </div>
      <ol className="flex flex-col gap-3" aria-label={isTopics ? 'Aufgestiegene Themen' : 'Aufgestiegene Wörter'}>
        {items.map((item, index) => (
          <li key={item.label}>
            <RankCard
              rank={item.currentRank ?? index + 1}
              label={movementName(kind, item.label)}
              detail={`Von Platz ${item.previousRank} auf Platz ${item.currentRank}`}
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
export function YouthLanguageResultSlide({ analysis, generation }: { analysis: YearOverYearAnalysis; generation?: YouthGeneration | null }) {
  const youth = analysis.youthLanguage;
  const hits = youth.words.filter(item => item.count > 0);
  const misses = youth.words.filter(item => item.count === 0).map(item => item.word);
  const top = hits[0];
  const speakers = youth.bySpeaker.slice(0, 6);
  const parties = youth.byParty.filter(item => item.party !== 'fraktionslos');
  const speakersLead = youth.bySpeaker.length > speakers.length
    ? 'Am häufigsten gesagt haben es:'
    : speakers.length === 1 ? 'Diese Person hat’s gesagt:' : speakers.length === 2 ? 'Diese beiden haben’s gesagt:' : `Diese ${cardinal(speakers.length)} haben’s gesagt:`;
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Gezählt werden auch Zitate. Ein Treffer allein verrät noch keine Haltung.</Note>}
    >
      {top ? (
        <div className="flex flex-col items-start gap-3">
          <Enter><Eyebrow>Jugendsprache im Plenum</Eyebrow></Enter>
          <Display size="xl" face="wide">„{capitalize(top.word)}“. <Mark>{capitalize(times(top.count))}.</Mark></Display>
          <Lead>
            {top.previousCount === 0
              ? `Im gleichen Zeitraum ${analysis.baseline.editionId}: kein Treffer.`
              : `Im gleichen Zeitraum ${analysis.baseline.editionId}: ${times(top.previousCount)}.`}
          </Lead>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <Enter><Eyebrow>Jugendsprache im Plenum</Eyebrow></Enter>
          <Display size="xl" face="wide">Diesmal ohne <Mark>Jugendwort.</Mark></Display>
          <Lead>Keiner der {cardinal(youth.words.length)} gesuchten Begriffe wurde in den ausgewerteten Reden im passenden Zusammenhang gefunden.</Lead>
        </div>
      )}
      {speakers.length > 0 && (
        <div className="flex flex-col gap-3">
          <Enter as="p" className="m-0 text-base font-semibold">{speakersLead}</Enter>
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
          {generation === 'older' && <Lead><strong>Niemand davon gehört zur Gen Z.</strong></Lead>}
          {parties.length > 1 && (
            <Enter as="p" className="m-0 text-base font-semibold">
              Nach Fraktion: {parties.map(item => `${item.party} ${number.format(item.count)}×`).join(' · ')}
            </Enter>
          )}
        </div>
      )}
      {hits.length > 1 && (
        <Enter className="flex flex-col items-start gap-3">
          <p className="m-0 text-base font-semibold">Diese Wörter fielen auch:</p>
          <ChipCloud words={hits.slice(1, 6).map(item => `${item.word} ${number.format(item.count)}×`)} label="Weitere Jugendwörter" />
        </Enter>
      )}
      {top && misses.length > 0 && (
        <Enter as="p" className="m-0 max-w-[40rem] text-base">
          <strong>{misses.length === 1 ? 'Der andere Begriff' : `Die anderen ${cardinal(misses.length)}`}? Kein Treffer.</strong> {misses.map(word => `„${word}“`).join(', ')}.
        </Enter>
      )}
    </Slide>
  );
}

function topicName(id: string): string {
  return TOPIC_BY_ID[id]?.name ?? id;
}

const timesAverage = (ratio: number) => `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(ratio)}-facher Bundestagsdurchschnitt`;

/** "Wo steckt Wirtschaft drin?": the words behind the topic, the party and the MPs who talk about it most. */
export function TopicRiserContextSlide({ context }: { context: TopicRiserContext }) {
  const { riser, parties, words, speakers } = context;
  const name = topicName(riser.label);
  const leader = parties[0];
  return (
    <Slide shapes="corner" footer={<Note className="ds-note--plate">Verglichen wird der Anteil an den jeweils gesprochenen Wörtern.</Note>}>
      <div className="flex flex-col items-start gap-3">
        <Display size="xl">{riser.currentRank === 1 ? <><Mark>{name}</Mark> liegt vorn.</> : <><Mark>{name}</Mark> ist aufgestiegen.</>} Was steckt dahinter?</Display>
        <Lead>Diese Wörter zählen zum Thema:</Lead>
      </div>
      {words.length > 0 && <ChipCloud words={words} label={`Häufigste Wörter zum Thema ${name}`} />}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      {leader && leader.vsAverage > 1 && (
        <div className="flex flex-col gap-3">
          <Enter as="p" className="m-0 text-base font-semibold">Besonders präsent {atParty(leader.party)}</Enter>
          <PartyGrid label={`Fraktion, die am meisten über ${name} spricht`}>
            <PartyBlock party={leader.party}>
              <FitWord word={`${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(leader.vsAverage)}×`} />
              <p className="m-0 text-base font-semibold">so hoch ist der Anteil von Wörtern zum Thema {name} im Vergleich zum gesamten Bundestag.</p>
            </PartyBlock>
          </PartyGrid>
        </div>
      )}
      {speakers.length > 0 && (
        <div className="flex flex-col gap-3">
        <Enter as="p" className="m-0 text-base font-semibold">Bei diesen Abgeordneten ist der Anteil am höchsten:</Enter>
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
        </div>
      )}
      </div>
    </Slide>
  );
}

const SMALL = ['Kein', 'Ein', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', 'Elf', 'Zwölf'];
const spelled = (value: number) => SMALL[value] ?? number.format(value);

/**
 * The end of the youth story: the Jugendwörter of earlier years, struck out
 * when nobody said them. The closing line only runs when the data carries it:
 * no youth word came from a Gen Z MP, and Gen Z MPs were identified at all.
 */
export function YouthHistorySlide({ analysis, generation }: { analysis: YearOverYearAnalysis; generation?: YouthGeneration | null }) {
  const past = analysis.youthLanguage.pastWinners ?? [];
  if (past.length === 0) return null;
  const survivors = past.filter(item => item.count > 0);
  const years = past.map(item => item.winnerYear);
  const gaps = Array.from({ length: Math.max(...years) - Math.min(...years) + 1 }, (_, index) => Math.min(...years) + index).filter(year => !years.includes(year));
  const parties = (item: (typeof past)[number]) => [...new Set((item.speakers ?? []).map(speaker => speaker.party))].join(', ');
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Kleine Zahlen, nur Treffer im passenden Zusammenhang{gaps.length ? ` · ${gaps.join(', ')} wurde kein Jugendwort gewählt` : ''}</Note>}
    >
      <div className="flex flex-col items-start gap-3">
        <Enter><Eyebrow>Jugendwörter seit {Math.min(...years)}</Eyebrow></Enter>
        <Display size="lg" face="wide">
          {spelled(past.length)} alte Jugendwörter. <Mark>{survivors.length === 0 ? 'Keins kam vor.' : survivors.length === 1 ? 'Eins hat überlebt.' : `${spelled(survivors.length)} haben überlebt.`}</Mark>
        </Display>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Jugendwörter der Vorjahre">
        {past.map(item => (
          <Enter as="li" key={item.word} kind="pop">
            <span
              data-surface={item.count > 0 ? 'light' : undefined}
              className={`inline-flex items-baseline gap-2 rounded-full px-4 py-2 font-wide text-lg font-extrabold ${item.count > 0 ? '' : 'line-through opacity-50'}`}
            >
              <span className="text-sm font-bold">{item.winnerYear}</span>
              <span>{item.word}</span>
              <span className="text-sm font-bold">{number.format(item.count)}×</span>
            </span>
          </Enter>
        ))}
      </ul>
      {survivors.map(item => (
        <Lead key={item.word}>„{item.word}“ ist von {item.winnerYear} und fiel {number.format(item.count)}× im Plenum{parties(item) ? `: ${parties(item)}` : ''}.</Lead>
      ))}
      {generation === 'older' && (
        <Display size="md" face="wide">Die Jungen reden wie Erwachsene. <Mark>Die Erwachsenen reden wie die Jungen.</Mark></Display>
      )}
    </Slide>
  );
}
