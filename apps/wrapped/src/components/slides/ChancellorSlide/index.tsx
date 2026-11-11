import { motion, type Variants } from 'motion/react';
import type { ChancellorAnalysis } from '@/generated/wrapped-contract-v1';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Block, ChipCloud, RankCard } from '@/design-system/components/Data';
import { Display, Eyebrow, Mark } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';
import { againstChamber, areaName, chancellorVerdict, focusArea, focusName, lastName, sideName, split } from '@/domain/chancellor';
import { capitalize, cardinal } from '@/lib/german-count';

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

const RANK_TONES = ['white', 'violet', 'pink'] as const;

function displayWord(word: string): string {
  return word.length <= 3 ? word.toUpperCase() : capitalize(word);
}

/** His three biggest topic areas next to his typical words. */
export function ChancellorTopicsSlide({ chancellor }: { chancellor: ChancellorAnalysis }) {
  const areas = chancellor.areas.slice(0, 3);
  const hot = chancellor.hotWords.slice(0, 6);
  return (
    <Slide shapes="corner">
      <Display size="xl">Worüber {lastName(chancellor.name)} <Mark>spricht.</Mark></Display>
      <div className="ds-chancellor-topics">
        <div className="flex flex-col gap-3">
          <Enter><span className="ds-chancellor-label">Seine Themen</span></Enter>
          <ol className="flex flex-col gap-3" aria-label={`Die häufigsten Themen von ${chancellor.name}, pro 1.000 Wörter verglichen mit dem restlichen Bundestag`}>
            {areas.map((area, index) => (
              <li key={area.id}>
                <RankCard
                  rank={index + 1}
                  label={areaName(area.id)}
                  detail={`${sideName(area.side)} · ${againstChamber(area, index > 0)}`}
                  tone={RANK_TONES[index % RANK_TONES.length]}
                  step={index}
                />
              </li>
            ))}
          </ol>
        </div>
        {hot.length > 0 && (
          <Block tone="card" enter="rise" className="ds-chancellor-words">
            <span className="ds-chancellor-label">Seine typischen Wörter</span>
            <ChipCloud words={hot.map(item => displayWord(item.word))} label={`Wörter, die ${chancellor.name} deutlich öfter sagt als der restliche Bundestag`} />
          </Block>
        )}
      </div>
    </Slide>
  );
}

/** "Merz spricht etwas mehr über innen- als über außenpolitische Themen. Im Vergleich … dominiert aber die Außenpolitik." */
function splitStatement(chancellor: ChancellorAnalysis): string {
  const name = lastName(chancellor.name);
  const verdict = chancellorVerdict(chancellor.foreignShare);
  const degree = verdict.close ? 'etwas' : 'deutlich';
  const first = verdict.side === 'beides'
    ? `${name} spricht etwa gleich viel über innen- und außenpolitische Themen.`
    : verdict.side === 'innen'
      ? `${name} spricht ${degree} mehr über innen- als über außenpolitische Themen.`
      : `${name} spricht ${degree} mehr über außen- als über innenpolitische Themen.`;
  const ratio = chancellor.chamberForeignShare > 0 ? chancellor.foreignShare / chancellor.chamberForeignShare : 0;
  if (ratio < 1.5) return first;
  return `${first} Im Vergleich zum Rest des Bundestages dominiert ${verdict.side === 'innen' ? 'aber ' : ''}die Außenpolitik.`;
}

/** One 100 % bar: Innen left, Außen right, the share inside each part. */
function SplitBar({ label, share, size }: { label: string; share: number; size: 'lead' | 'rest' }) {
  const { foreign, domestic } = split(share);
  const tags = size === 'lead';
  return (
    <motion.div variants={ENTER.rise} className={`ds-io ds-io--${size}`}>
      <span className="ds-chancellor-label">{label}</span>
      {tags && (
        <span className="ds-io__tags" aria-hidden="true"><span>Innen</span><span>Außen</span></span>
      )}
      <span className="sr-only">{label}: {domestic} % innen, {foreign} % außen</span>
      <motion.span className="ds-io__bar" variants={ENTER.grow} aria-hidden="true">
        <span className="ds-io__part ds-io__part--innen" style={{ flexGrow: domestic }}>
          {domestic >= 12 && <span>{domestic} %</span>}
          {tags && <span className="ds-io__tag">Innen</span>}
        </span>
        <span className="ds-io__part ds-io__part--aussen" style={{ flexGrow: foreign }}>
          {tags && <span className="ds-io__tag">Außen</span>}
          {foreign >= 12 && <span>{foreign} %</span>}
        </span>
      </motion.span>
    </motion.div>
  );
}

/** The answer: his split against the rest of the chamber. */
export function ChancellorSplitSlide({ chancellor }: { chancellor: ChancellorAnalysis }) {
  return (
    <Slide shapes="corner">
      <div className="flex flex-col gap-3">
        <Display size="xl">Innen- oder <Mark>Außen&shy;kanzler?</Mark></Display>
        <motion.p variants={ENTER.rise} className="ds-statement ds-statement--long [hyphens:manual]">{splitStatement(chancellor)}</motion.p>
      </div>
      <div className="flex flex-col gap-5">
        <SplitBar label={lastName(chancellor.name)} share={chancellor.foreignShare} size="lead" />
        <SplitBar label="Rest des Bundestages" share={chancellor.chamberForeignShare} size="rest" />
      </div>
    </Slide>
  );
}

/** "3" for 2,98, otherwise one decimal. */
const factor = (ratio: number) => (Math.abs(ratio - Math.round(ratio)) <= 0.15 ? String(Math.round(ratio)) : decimal(ratio));

/** The EU circle of twelve stars behind the slide, turning slowly. Decoration only. */
function TurningStars() {
  return (
    <div className="ds-eu-ring" aria-hidden="true">
      <motion.div className="ds-eu-ring__turn" variants={STAGGER_STARS} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (Math.PI / 6) * i - Math.PI / 2;
          return (
            <span key={i} className="ds-eu-ring__star" style={{ left: `${50 + 42 * Math.cos(angle)}%`, top: `${50 + 42 * Math.sin(angle)}%` }}>
              <motion.svg viewBox="0 0 20 20" variants={STAR_IN}><polygon points={starPoints(10, 10, 10)} fill="currentColor" /></motion.svg>
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}

const STAGGER_STARS: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const STAR_IN: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.7, ease: [0.2, 1.25, 0.4, 1] as const } },
};

/**
 * The twist after the split: the area that sets him apart from the chamber.
 * Below 1.5 times the chamber it is no twist, so the title only names the area.
 */
export function ChancellorFocusSlide({ chancellor }: { chancellor: ChancellorAnalysis }) {
  const focus = focusArea(chancellor.areas);
  if (!focus) return null;
  const { area, ratio } = focus;
  const name = focusName(area.id);
  const twist = ratio >= 1.5;
  const words = (area.side === 'aussen' ? chancellor.foreignWords : chancellor.domesticWords).slice(0, 3);
  return (
    <Slide shapes={area.id === 'europa' ? false : 'corner'} align="center" className="ds-chancellor-focus">
      {area.id === 'europa' && <TurningStars />}
      <Display size="hero">
        {twist
          ? <><span className="ds-chancellor-focus__lead">Oder ist er der</span> <Mark>{name}-</Mark><br />Kanzler?</>
          : <><span className="ds-chancellor-focus__lead">Sein Schwerpunkt:</span> <Mark>{name}.</Mark></>}
      </Display>
      {ratio >= 1.1 && (
        <motion.p variants={ENTER.rise} className="ds-statement ds-statement--long max-w-[45rem]">
          {chancellor.name} spricht {factor(ratio)}× so oft über das Thema {name} wie der Rest des Bundestages.
        </motion.p>
      )}
      {words.length > 0 && (
        <motion.ul variants={ENTER.rise} className="ds-chips justify-center" aria-label={`${sideName(area.side)} am häufigsten`}>
          {words.map((item, index) => (
            <li key={item.word} className={`ds-chip ds-chip--${['pink', 'white', 'outline'][index % 3]}`} style={{ '--chip-tilt': `${[-2, 1.5, -1][index % 3]}deg` } as React.CSSProperties}>
              {displayWord(item.word)} · {item.count}×
            </li>
          ))}
        </motion.ul>
      )}
    </Slide>
  );
}
