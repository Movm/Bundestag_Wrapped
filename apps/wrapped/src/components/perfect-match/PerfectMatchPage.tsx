import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, MotionConfig, useReducedMotion } from 'motion/react';
import { SEO } from '@/components/seo/SEO';
import { useMatchData } from '@/hooks/useDataQueries';
import { STAGGER } from '@/design-system/motion';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';
import { TOPICS } from '@/shared/constants/topics';
import { DECK_SIZE, scoreMatches, type MatchData } from '@/lib/perfect-match';
import { RankStep } from './RankStep';
import { TopicsStep, type Slots } from './TopicsStep';
import { WordsStep } from './WordsStep';
import { SwipeStep } from './SwipeStep';
import { ResultStep } from './ResultStep';
import './perfect-match.css';

const STEPS = ['Fraktionen', 'Themen', 'Wörter', 'Spirit Animal', 'Ergebnis'] as const;
/** Time to see the last card fly out before the result opens. */
const RESULT_DELAY_MS = 450;
const EMPTY_SLOTS: Slots = [null, null, null];

function PerfectMatch({ data, homeUrl, profileUrl }: { data: MatchData; homeUrl: string; profileUrl: (slug: string) => string }) {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [order, setOrder] = useState<string[]>(data.parties);
  const [slots, setSlots] = useState<Slots>(EMPTY_SLOTS);
  const [words, setWords] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [decided, setDecided] = useState(0);

  const topics = useMemo(() => TOPICS.map(topic => topic.id).filter(id => data.topics.includes(id)), [data.topics]);
  const deck = useMemo(() => [...data.animals].sort((a, b) => b.count - a.count).slice(0, DECK_SIZE), [data.animals]);
  const matches = useMemo(
    () => (step === 4 ? scoreMatches(data, { order, topics: slots.filter((id): id is string => Boolean(id)), words, likedAnimals: liked }) : []),
    [step, data, order, slots, words, liked],
  );

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo(0, 0);
    stageRef.current?.focus({ preventScroll: true });
  }, [step, attempt]);

  const decide = useCallback((direction: 1 | -1) => {
    const animal = deck[decided];
    if (!animal) return;
    if (direction > 0) setLiked(previous => [...previous, animal.id]);
    const next = decided + 1;
    setDecided(next);
    if (next >= deck.length) window.setTimeout(() => setStep(4), reduce ? 0 : RESULT_DELAY_MS);
  }, [deck, decided, reduce]);

  const restart = () => {
    setOrder(data.parties);
    setSlots(EMPTY_SLOTS);
    setWords([]);
    setLiked([]);
    setDecided(0);
    setStep(0);
    setAttempt(value => value + 1);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="pm__bar">
        <div className="pm__who">
          <div className="pm__progress" role="progressbar" aria-label="Fortschritt" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-valuetext={`Schritt ${step + 1} von ${STEPS.length}: ${STEPS[step]}`}>
            {STEPS.map((label, index) => <span key={label} data-done={index <= step} />)}
          </div>
          <span className="pm__tag">Perfect Match</span>
        </div>
        <Link to={homeUrl} className="pm__close" aria-label="Perfect Match schließen">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </Link>
      </div>

      <motion.div
        key={`${attempt}-${step}`}
        ref={stageRef}
        tabIndex={-1}
        className={`pm__stage outline-none${step === 3 ? ' pm-swipe' : ''}`}
        variants={STAGGER}
        initial={reduce ? false : 'hidden'}
        animate="visible"
      >
        {step === 0 && <RankStep order={order} onChange={setOrder} onDone={() => setStep(1)} />}
        {step === 1 && <TopicsStep topics={topics} slots={slots} onChange={setSlots} onDone={() => setStep(2)} />}
        {step === 2 && <WordsStep words={data.words} picked={words} onChange={setWords} onDone={() => setStep(3)} />}
        {step === 3 && <SwipeStep animals={deck} decided={decided} onDecide={decide} />}
        {step === 4 && <ResultStep matches={matches} profileUrl={profileUrl} onRestart={restart} />}
      </motion.div>
    </MotionConfig>
  );
}

export function PerfectMatchPage() {
  const edition = useOptionalEdition();
  const surface = editionSurface(edition);
  const available = Boolean(edition?.manifest?.assets.match);
  const { data, isLoading, error } = useMatchData({ enabled: available });
  const homeUrl = editionPath(surface);
  const profileUrl = useCallback((slug: string) => editionPath(surface, `abgeordnete/${slug}`), [surface]);

  let body;
  if (edition?.manifest && !available) {
    body = (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p className="mp-h2">Perfect Match gibt es für diese Ausgabe noch nicht</p>
        <Link to={editionPath(surface, 'abgeordnete')} className="mp-link">Zur Abgeordneten-Suche</Link>
      </div>
    );
  } else if (error) {
    body = (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p className="mp-h2">Die Daten für Perfect Match ließen sich nicht laden</p>
        <p className="mp-muted m-0">{error.message}</p>
        <Link to={homeUrl} className="mp-link">Zurück zur Startseite</Link>
      </div>
    );
  } else if (isLoading || !data) {
    body = <p role="status" className="mp-muted">Lade Perfect Match …</p>;
  }

  return (
    <>
      <SEO
        title="Perfect Match: Wer im Bundestag passt zu dir?"
        description="Fraktionen sortieren, Themen ziehen, Wörter wählen, swipen: Welche Abgeordneten passen zu dir? Berechnet aus allen Reden des Jahres."
        canonicalUrl={editionPath(surface, 'perfect-match')}
      />
      {body ? (
        <div className="mp-page grid place-items-center px-6">{body}</div>
      ) : (
        <div className="mp-page pm">
          <PerfectMatch data={data!} homeUrl={homeUrl} profileUrl={profileUrl} />
        </div>
      )}
    </>
  );
}
