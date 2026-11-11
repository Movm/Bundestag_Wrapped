import { motion } from 'motion/react';
import type { ChancellorAnalysis } from '@/generated/wrapped-contract-v1';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Block, ChipCloud, RankCard } from '@/design-system/components/Data';
import { BigNumber, Display, Eyebrow, Mark, Note } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';
import { againstChamber, areaName, chancellorVerdict, focusArea, focusName, lastName, sideName, split, timesAs } from '@/domain/chancellor';
import { capitalize, cardinal, times } from '@/lib/german-count';

const number = new Intl.NumberFormat('de-DE');
const decimal = (value: number) => value.toLocaleString('de-DE', { maximumFractionDigits: 1 });

/** Five-pointed star as an SVG point list, centred on (cx, cy). */
function starPoints(cx: number, cy: number, outer: number): string {
  const inner = outer * 0.382;
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

/** The EU's circle of twelve stars, computed. Palette tokens only. Decoration. */
function StarRing({ cx, cy, ring, star, fill }: { cx: number; cy: number; ring: number; star: number; fill: string }) {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (Math.PI / 6) * i - Math.PI / 2;
        return <polygon key={i} points={starPoints(cx + ring * Math.cos(angle), cy + ring * Math.sin(angle), star)} fill={fill} />;
      })}
    </>
  );
}

/** A house and the circle of EU stars: inside and outside. Decoration only. */
function HouseAndStars() {
  return (
    <motion.svg variants={ENTER.slide} viewBox="0 0 260 120" className="ds-chancellor-art" aria-hidden="true" focusable="false">
      <path d="M14 62 62 22l48 40v50H14Z" fill="var(--color-wr-pink)" />
      <path d="M48 112V80h28v32" fill="var(--color-wr-deep)" />
      <path d="M118 66h28" stroke="var(--color-wr-lilac)" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 10" />
      <circle cx="206" cy="64" r="40" fill="var(--color-wr-violet)" />
      <StarRing cx={206} cy={64} ring={40} star={8} fill="var(--color-wr-white)" />
    </motion.svg>
  );
}

/** The star ring on its own, for the Europe slide. Decoration only. */
function EuropeStars() {
  return (
    <motion.svg variants={ENTER.slide} viewBox="0 0 120 120" className="ds-chancellor-stars" aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="44" fill="var(--color-wr-violet)" />
      <StarRing cx={60} cy={60} ring={44} star={9} fill="var(--color-wr-white)" />
    </motion.svg>
  );
}

/** "acht Reden und 101 Antworten in der Regierungsbefragung" — parts without a count are left out. */
function contributions(chancellor: ChancellorAnalysis): string {
  const parts = [
    chancellor.speeches > 0 && `${cardinal(chancellor.speeches)} ${chancellor.speeches === 1 ? 'Rede' : 'Reden'}`,
    chancellor.answers > 0 && `${cardinal(chancellor.answers)} ${chancellor.answers === 1 ? 'Antwort' : 'Antworten'} in der Regierungsbefragung`,
  ].filter(Boolean);
  return parts.length ? parts.join(' und ') : `${cardinal(chancellor.contributions)} Beiträge`;
}

/** Opener: the question and how much the chancellor said. */
export function ChancellorIntroSlide({ chancellor, year }: { chancellor: ChancellorAnalysis; year?: number | null }) {
  return (
    <Slide shapes="orbit">
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>Kanzler-Check</Eyebrow>
      </motion.div>
      <Display size="xl">Innen- oder <Mark>Außen&shy;kanzler?</Mark></Display>
      <motion.p variants={ENTER.rise} className="ds-statement">
        {chancellor.name} kommt {year ? `${year} ` : ''}auf {contributions(chancellor)}. Zusammen {number.format(chancellor.words)} Wörter. Wohin schaut er öfter: nach innen oder nach außen?
      </motion.p>
      <HouseAndStars />
    </Slide>
  );
}

interface SplitRow { label: string; share: number }

/** Innen and Außen as one 100 % bar per row. The table reads the same without the bars. */
function SplitBars({ rows }: { rows: SplitRow[] }) {
  return (
    <Block tone="white" enter="rise" className="ds-split">
      <span className="ds-split__legend" aria-hidden="true">
        <span><span className="ds-split__key ds-split__key--innen" />Innen</span>
        <span><span className="ds-split__key ds-split__key--aussen" />Außen</span>
      </span>
      <table className="ds-split__table">
        <caption className="sr-only">Anteil von Innen- und Außenpolitik an allen Themenwörtern. Restlicher Bundestag: alle anderen Redebeiträge dieser Edition.</caption>
        <thead className="sr-only"><tr><th scope="col">Wer</th><th scope="col">Anteil</th></tr></thead>
        <tbody>
          {rows.map(row => {
            const { foreign, domestic } = split(row.share);
            return (
              <tr key={row.label}>
                <th scope="row" className="ds-split__label">{row.label}</th>
                <td className="ds-split__track">
                  <span className="sr-only">{domestic} % innen, {foreign} % außen</span>
                  <motion.span className="ds-split__bar" variants={ENTER.grow} aria-hidden="true">
                    <span className="ds-split__part ds-split__part--innen" style={{ flexGrow: domestic }}>{domestic >= 12 ? `${domestic} %` : ''}</span>
                    <span className="ds-split__part ds-split__part--aussen" style={{ flexGrow: foreign }}>{foreign >= 12 ? `${foreign} %` : ''}</span>
                  </motion.span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Block>
  );
}

const VERDICT = {
  innen: 'Innenkanzler.',
  aussen: 'Außenkanzler.',
  beides: 'Halb innen, halb außen.',
};

/** The answer: the split for the chancellor, the year before and the rest of the chamber. */
export function ChancellorSplitSlide({ chancellor, year }: { chancellor: ChancellorAnalysis; year?: number | null }) {
  const verdict = chancellorVerdict(chancellor.foreignShare);
  const name = lastName(chancellor.name);
  const thisYear = year ? ` ${year}` : '';
  const rows: SplitRow[] = [
    { label: `${name}${thisYear}`, share: chancellor.foreignShare },
    ...(chancellor.previous ? [{ label: `${name} ${chancellor.previous.year}`, share: chancellor.previous.foreignShare }] : []),
    { label: 'Restlicher Bundestag', share: chancellor.chamberForeignShare },
  ];
  const ratio = chancellor.chamberForeignShare > 0 ? chancellor.foreignShare / chancellor.chamberForeignShare : null;
  return (
    <Slide
      shapes="corner"
      footer={(
        <Note className="ds-note--plate">
          Anteil an Themenwörtern · {number.format(chancellor.contributions)} Beiträge als Kanzler
          {chancellor.previous ? `, ${chancellor.previous.year} gleicher Zeitraum: ${number.format(chancellor.previous.contributions)}` : ''}
        </Note>
      )}
    >
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Innen oder außen?</Eyebrow></Enter>
        <Display size="xl" face="wide">
          {VERDICT[verdict.side]}{verdict.side !== 'beides' && <> <Mark>{verdict.close ? 'Knapp.' : 'Deutlich.'}</Mark></>}
        </Display>
      </div>
      <SplitBars rows={rows} />
      {ratio !== null && ratio >= 1.1 && (
        <motion.p variants={ENTER.rise} className="ds-statement ds-statement--long">
          Sein Außen-Anteil ist {timesAs(ratio)} hoch wie im restlichen Bundestag.
        </motion.p>
      )}
    </Slide>
  );
}

/** "3" for 2,98, otherwise one decimal: the factor in the big number. */
const factor = (ratio: number) => (Math.abs(ratio - Math.round(ratio)) <= 0.15 ? String(Math.round(ratio)) : decimal(ratio));

/** Words drawn with a non-breaking hyphen: "83‑mal" never breaks. */
const counted = (words: { word: string; count: number }[]) =>
  words.map(item => `${displayWord(item.word)} (${times(item.count).replace('-', '\u2011')})`).join(', ');

/**
 * The twist after the verdict: the area that sets him apart from the chamber,
 * as a factor and as two bars per 1,000 words. A factor below 1.5 is no twist,
 * so the title then only names the area.
 */
export function ChancellorFocusSlide({ chancellor }: { chancellor: ChancellorAnalysis }) {
  const focus = focusArea(chancellor.areas);
  if (!focus) return null;
  const { area, ratio } = focus;
  const name = focusName(area.id);
  const max = Math.max(area.perThousand, area.chamberPerThousand) || 1;
  const bars = [
    { label: lastName(chancellor.name), value: area.perThousand, tone: 'him' },
    { label: 'Restlicher Bundestag', value: area.chamberPerThousand, tone: 'rest' },
  ];
  const words = (area.side === 'aussen' ? chancellor.foreignWords : chancellor.domesticWords).slice(0, 3);
  return (
    <Slide
      shapes={false}
      footer={<Note className="ds-note--plate">Themenwörter pro 1.000 Wörter, verglichen mit allen anderen Redebeiträgen dieser Edition.</Note>}
    >
      <div className="flex flex-col gap-4">
        <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
          <Eyebrow>{ratio >= 1.5 ? 'Aber vor allem' : 'Sein Schwerpunkt'}</Eyebrow>
        </motion.div>
        <Display size="xl" face="wide">{ratio >= 1.5 ? <><Mark>{name}</Mark>-Kanzler.</> : <Mark>{name}.</Mark>}</Display>
      </div>
      <Block tone="white" enter="rise" className="ds-focus">
        {ratio >= 1.1 && (
          <p className="ds-focus__factor">
            <BigNumber>{factor(ratio)}×</BigNumber>
            <span>so oft über {name} wie der restliche Bundestag</span>
          </p>
        )}
        <dl className="ds-focus__bars">
          {bars.map(bar => (
            <div key={bar.tone} className="ds-focus__row">
              <dt>{bar.label}</dt>
              <dd>
                <motion.span
                  variants={ENTER.grow}
                  className={`ds-focus__bar ds-focus__bar--${bar.tone}`}
                  style={{ width: `${Math.max(4, (bar.value / max) * 100)}%` }}
                  aria-hidden="true"
                />
                <span className="ds-focus__value">{bar.value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<span className="sr-only"> pro 1.000 Wörter</span></span>
              </dd>
            </div>
          ))}
        </dl>
      </Block>
      <div className="ds-chancellor-words">
        {words.length > 0 && (
          <motion.p variants={ENTER.rise} className="m-0 text-base font-semibold">
            <span className="ds-chancellor-side">{sideName(area.side)} am häufigsten:</span> {counted(words)}
          </motion.p>
        )}
        {area.id === 'europa' && <EuropeStars />}
      </div>
    </Slide>
  );
}

const RANK_TONES = ['white', 'violet', 'pink', 'card', 'white'] as const;

/** His five biggest topic areas, each against the rest of the chamber. */
export function ChancellorTopicsSlide({ chancellor }: { chancellor: ChancellorAnalysis }) {
  const areas = chancellor.areas.slice(0, 5);
  return (
    <Slide shapes={false}>
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Seine Themen</Eyebrow></Enter>
        <Display size="lg" face="wide">Worüber {lastName(chancellor.name)} <Mark>spricht.</Mark></Display>
      </div>
      <ol className="flex flex-col gap-3" aria-label={`Die häufigsten Themen von ${chancellor.name}, gemessen pro 1.000 Wörter und verglichen mit allen anderen Redebeiträgen`}>
        {areas.map((area, index) => (
          <li key={area.id}>
            <RankCard
              rank={index + 1}
              label={areaName(area.id)}
              detail={`${sideName(area.side)} · ${capitalize(againstChamber(area))}`}
              tone={RANK_TONES[index % RANK_TONES.length]}
              step={index}
            />
          </li>
        ))}
      </ol>
    </Slide>
  );
}

function displayWord(word: string): string {
  return word.length <= 3 ? word.toUpperCase() : capitalize(word);
}

/** Typical nouns: the words he uses far more often than the rest of the chamber. */
export function ChancellorWordsSlide({ chancellor }: { chancellor: ChancellorAnalysis }) {
  const hot = chancellor.hotWords.slice(0, 6);
  const [leader] = hot;
  if (!leader) return null;
  return (
    <Slide
      shapes={false}
      footer={<Note className="ds-note--plate">Hauptwörter, die er deutlich öfter nutzt als alle anderen dieser Edition, in mindestens drei Beiträgen. Ohne Anrede- und Zeitwörter.</Note>}
    >
      <div className="flex flex-col gap-4">
        <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
          <Eyebrow>{lastName(chancellor.name)}</Eyebrow>
        </motion.div>
        <Display size="lg" face="wide">Seine <Mark>typischen Wörter.</Mark></Display>
      </div>
      <ChipCloud words={hot.map(item => displayWord(item.word))} label={`Wörter, die ${chancellor.name} öfter sagt als der restliche Bundestag`} />
      <motion.p variants={ENTER.rise} className="ds-statement ds-statement--long">
        Vorn: „{displayWord(leader.word)}“, mindestens {decimal(leader.ratio)}-mal so oft wie im restlichen Bundestag.
      </motion.p>
    </Slide>
  );
}
