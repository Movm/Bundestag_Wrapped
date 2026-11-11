import type { SignatureWordMovement, YearOverYearAnalysis } from '@/generated/wrapped-contract-v1';
import { getPartyTone } from '@/lib/party-colors';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import type { TopicRiserContext } from '@/domain/topic-riser-context';
import { atParty, capitalize, cardinal } from '@/lib/german-count';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, FitWord, Lead, Mark, Note } from '@/design-system/components/Type';
import { ChipCloud, Delta, RankCard } from '@/design-system/components/Data';
import { PartyBlock, PartyGrid } from '@/design-system/components/PartyBlock';

type RankingKind = 'topics' | 'words';


const RANK_TONES = ['white', 'violet', 'pink', 'card'] as const;

function movementName(kind: RankingKind, label: string): string {
  return kind === 'topics' ? topicName(label) : label;
}

/** "Drei Themen rücken nach vorn": stair-stepped rank cards, biggest riser first. */
export function RankingMovementSlide({ analysis, kind }: { analysis: YearOverYearAnalysis; kind: RankingKind }) {
  const items = analysis[kind]
    .filter(item => item.previousRank !== null && item.rankChange > 0)
    .slice(0, 4);
  const isTopics = kind === 'topics';
  return (
    <Slide shapes="corner">
      <div className="flex flex-col items-start gap-4">
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
              previousRank={item.previousRank ?? undefined}
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
  if (item.previousRank === null) return <span className={`ds-contrast ds-delta whitespace-nowrap${small}`}>Neu dabei</span>;
  if (item.currentRank === null) return <span className={`ds-contrast ds-delta whitespace-nowrap${small}`}>Nicht mehr dabei</span>;
  return <Delta change={item.previousRank - item.currentRank} size={size} />;
}

export function SignatureWordMovementSlide({ analysis }: { analysis: YearOverYearAnalysis }) {
  const parties = analysis.signatureWords.filter(item => item.risers.length > 0 || item.fallers.length > 0);
  return (
    <Slide shapes="corner">
      <div className="flex flex-col gap-4">
        <Display size="xl" face="wide">
          Das hat sich im Vergleich zu <Mark>{analysis.baseline.editionId}</Mark> geändert:
        </Display>
        <Lead>So haben sich die fünf typischsten Wörter jeder Fraktion verändert.</Lead>
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
                    <li key={item.word} lang="de" data-surface="light" className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-[1.25rem] py-1 pl-3 pr-1 font-wide text-base font-extrabold">
                      {/* The badge wraps under a long word instead of squeezing it into a column of letters. */}
                      <span className="min-w-0 hyphens-auto [overflow-wrap:break-word]">{item.word}</span>
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
        <Display size="xl">{riser.label === 'wirtschaft' && riser.currentRank === 1
          ? <>It’s the <Mark>Economy</Mark>.</>
          : <>{riser.currentRank === 1 ? <><Mark>{name}</Mark> liegt vorn.</> : <><Mark>{name}</Mark> ist aufgestiegen.</>} Was steckt dahinter?</>}</Display>
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

