import { motion } from 'motion/react';
import type { ChancellorAnalysis } from '@/generated/wrapped-contract-v1';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Block, ChipCloud, RankCard } from '@/design-system/components/Data';
import { Display, Eyebrow, Mark, Note } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';
import { againstChamber, areaName, chancellorVerdict, lastName, sideName, split, timesAs } from '@/domain/chancellor';
import { capitalize, cardinal, times } from '@/lib/german-count';

const number = new Intl.NumberFormat('de-DE');
const decimal = (value: number) => value.toLocaleString('de-DE', { maximumFractionDigits: 1 });

/** A house and a globe: inside and outside. Decoration only. */
function HouseAndGlobe() {
  return (
    <motion.svg variants={ENTER.slide} viewBox="0 0 260 120" className="ds-chancellor-art" aria-hidden="true" focusable="false">
      <path d="M14 62 62 22l48 40v50H14Z" fill="#ff4fa0" />
      <path d="M48 112V80h28v32" fill="#3a1670" />
      <path d="M118 66h28" stroke="#b98cff" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 10" />
      <circle cx="206" cy="64" r="46" fill="none" stroke="#b98cff" strokeWidth="6" />
      <ellipse cx="206" cy="64" rx="20" ry="46" fill="none" stroke="#b98cff" strokeWidth="4" />
      <path d="M160 64h92M166 40h80M166 88h80" fill="none" stroke="#b98cff" strokeWidth="4" />
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
      <HouseAndGlobe />
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
        <caption className="sr-only">Anteil von Innen- und Außenpolitik an allen Themenwörtern</caption>
        <thead className="sr-only"><tr><th scope="col">Wer</th><th scope="col">Anteil</th></tr></thead>
        <tbody>
          {rows.map(row => {
            const { foreign, domestic } = split(row.share);
            return (
              <tr key={row.label}>
                <th scope="row" className="ds-split__label">
                  {row.label}
                  <span className="ds-split__value" aria-hidden="true">{foreign} % außen</span>
                </th>
                <td className="ds-split__track">
                  <span className="sr-only">{domestic} % innen, {foreign} % außen</span>
                  <motion.span className="ds-split__bar" variants={ENTER.grow} aria-hidden="true">
                    <span className="ds-split__part ds-split__part--innen" style={{ flexGrow: domestic }}>{domestic >= 18 ? `${domestic} %` : ''}</span>
                    <span className="ds-split__part ds-split__part--aussen" style={{ flexGrow: foreign }}>{foreign >= 18 ? `${foreign} %` : ''}</span>
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
          Anteil an allen Themenwörtern. Gezählt: {number.format(chancellor.contributions)} Beiträge als Kanzler
          {chancellor.previous ? `, ${chancellor.previous.year} im gleichen Zeitraum ${number.format(chancellor.previous.contributions)}` : ''}.
          {' '}Restlicher Bundestag: alle anderen Redebeiträge dieser Edition.
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

const RANK_TONES = ['white', 'violet', 'pink', 'card', 'white'] as const;

/** His five biggest topic areas, each against the rest of the chamber. */
export function ChancellorTopicsSlide({ chancellor }: { chancellor: ChancellorAnalysis }) {
  const areas = chancellor.areas.slice(0, 5);
  return (
    <Slide shapes={false} footer={<Note className="ds-note--plate">Gemessen pro 1.000 Wörter, verglichen mit allen anderen Redebeiträgen.</Note>}>
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Seine Themen</Eyebrow></Enter>
        <Display size="lg" face="wide">Worüber {lastName(chancellor.name)} <Mark>spricht.</Mark></Display>
      </div>
      <ol className="flex flex-col gap-3" aria-label={`Die häufigsten Themen von ${chancellor.name}`}>
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

/** Typical nouns, and the topic words he used most on each side ("83‑mal" keeps its hyphen unbroken). */
export function ChancellorWordsSlide({ chancellor }: { chancellor: ChancellorAnalysis }) {
  const hot = chancellor.hotWords.slice(0, 6);
  const [leader] = hot;
  const sides = [
    { label: 'Außen am häufigsten', words: chancellor.foreignWords.slice(0, 3) },
    { label: 'Innen am häufigsten', words: chancellor.domesticWords.slice(0, 3) },
  ].filter(side => side.words.length > 0);
  return (
    <Slide
      shapes={false}
      footer={<Note className="ds-note--plate">Typisch: Hauptwörter, die er deutlich häufiger nutzt als alle anderen Redner*innen dieser Edition, in mindestens drei Beiträgen. Anrede- und Zeitwörter sind ausgenommen.</Note>}
    >
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>Typisch {lastName(chancellor.name)}</Eyebrow>
      </motion.div>
      {leader && (
        <div className="flex flex-col items-start gap-3">
          <Display size="md">Seine <Mark>typischen Wörter.</Mark></Display>
          <ChipCloud words={hot.map(item => displayWord(item.word))} label={`Wörter, die ${chancellor.name} öfter sagt als der restliche Bundestag`} />
          <motion.p variants={ENTER.rise} className="m-0 text-base font-semibold">
            Vorn: „{displayWord(leader.word)}“, mindestens {decimal(leader.ratio)}-mal so oft wie im restlichen Bundestag.
          </motion.p>
        </div>
      )}
      {sides.map(side => (
        <motion.p key={side.label} variants={ENTER.rise} className="m-0 text-base font-semibold">
          <span className="ds-chancellor-side">{side.label}:</span>{' '}
          {side.words.map(item => `${displayWord(item.word)} (${times(item.count).replace('-', '\u2011')})`).join(', ')}
        </motion.p>
      ))}
    </Slide>
  );
}
