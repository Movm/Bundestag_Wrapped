import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { SEO } from '@/components/seo/SEO';
import { useSpeakerData } from '@/hooks/useDataQueries';
import { useQuizEngine } from '@/design-system/quiz/engine';
import { TilesLayout } from '@/design-system/quiz/layouts/TilesLayout';
import { ENTER, STAGGER } from '@/design-system/motion';
import { playSound } from '@/lib/sounds';
import { displaySpeakerName } from '@/lib/speaker-profile-utils';
import {
  buildMdbQuiz,
  estimateIsCorrect,
  estimateVerdict,
  finalLine,
  formatRatio,
  genitive,
  type MdbEstimateRound,
  type MdbPickRound,
  type MdbQuiz,
  type MdbQuizRound,
} from '@/lib/mdb-quiz';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';
import { ArrowIcon, GrowBar, PartyPill, RatioBars } from './shared';
import { partyStyle } from './party-style';

/** Time to see the marked answer before the result card opens. */
const RESULT_DELAY_MS = 650;
const VS_LABEL = { bundestag: 'vs. Bundestag', party: 'vs. eigene Fraktion' } as const;

interface Outcome {
  correct: boolean;
  verdict: string;
  stat: string;
  explanation: string;
}

function PickRound({ round, onAnswer }: { round: MdbPickRound; onAnswer: (correct: boolean) => void }) {
  const engine = useQuizEngine({ question: round.question, options: round.options, explanation: round.explanation }, { onAnswer });
  const questionId = useId();
  return <TilesLayout engine={engine} questionId={questionId} />;
}

function EstimateRound({ round, done, onAnswer }: { round: MdbEstimateRound; done: boolean; onAnswer: (guess: number) => void }) {
  const [guess, setGuess] = useState(5);
  const id = useId();
  return (
    <motion.div variants={ENTER.rise} className="mpq-estimate">
      <div className="mpq-estimate__top">
        <p className="mpq-estimate__value">
          <output htmlFor={id} aria-live="off">{guess.toLocaleString('de-DE')}</output><span aria-hidden="true">×</span>
        </p>
        <span className="mpq-estimate__hint">so oft wie ein durchschnittliches Mitglied des Bundestags</span>
      </div>
      <input
        id={id}
        className="mpq-range"
        type="range"
        min={1}
        max={round.max}
        step={0.5}
        value={guess}
        disabled={done}
        aria-label="Deine Schätzung"
        aria-valuetext={`${guess.toLocaleString('de-DE')}-mal so oft`}
        onChange={event => setGuess(Number(event.target.value))}
      />
      <div className="mpq-estimate__scale" aria-hidden="true"><span>1× · normal</span><span>{round.max / 2}×</span><span>{round.max}×</span></div>
      <button type="button" className="mp-btn mp-btn--pink mp-btn--lg self-start" disabled={done} onClick={() => onAnswer(guess)}>Tipp abgeben</button>
    </motion.div>
  );
}

function outcomeFor(round: MdbQuizRound, correct: boolean, guess: number | null): Outcome {
  if (round.kind === 'estimate') {
    const verdict = estimateVerdict(guess ?? 0, round.answer);
    return {
      correct, verdict, stat: formatRatio(round.answer),
      explanation: `Dein Tipp: ${formatRatio(guess ?? 0)}.${round.word.party ? ` Gegenüber der eigenen Fraktion sind es ${formatRatio(round.word.party)}.` : ''}`,
    };
  }
  return {
    correct,
    verdict: correct ? 'Richtig!' : 'Knapp daneben.',
    stat: round.options.find(option => option.isCorrect)?.text ?? '',
    explanation: round.explanation,
  };
}

function FinalTable({ quiz }: { quiz: MdbQuiz }) {
  const max = Math.max(1, ...quiz.words.map(word => Math.max(word.bundestag ?? 0, word.party ?? 0)));
  const cell = (value: number | null, color: string) => (
    <div className="mpq-cell">
      <span className="mpq-cell__track" aria-hidden="true">{value !== null && <GrowBar className="" width={(value / max) * 100} style={{ background: color }} />}</span>
      <span className="mpq-cell__value">{value !== null ? formatRatio(value) : '–'}</span>
    </div>
  );
  return (
    <motion.div variants={ENTER.slide} className="mpq-table-wrap">
      <table className="mpq-table">
        <caption className="sr-only">Signaturwörter: wie viel häufiger als Bundestag und Fraktion</caption>
        <thead><tr><th scope="col">Wort</th><th scope="col">vs. Bundestag</th><th scope="col">vs. Fraktion</th></tr></thead>
        <tbody>
          {quiz.words.map(word => (
            <tr key={word.word}>
              <td>{word.word}</td>
              <td>{cell(word.bundestag, 'var(--color-wr-pink)')}</td>
              <td>{cell(word.party, 'var(--color-wr-mint)')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

function Quiz({ quiz, name, party, profileUrl }: { quiz: MdbQuiz; name: string; party: string; profileUrl: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [resultOpen, setResultOpen] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const verdictId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const total = quiz.rounds.length;
  const finished = step >= total;
  const round = quiz.rounds[Math.min(step, total - 1)];
  const outcome = outcomes[step] ?? null;
  const score = outcomes.filter(item => item.correct).length;

  const answer = (correct: boolean, guess: number | null) => {
    if (outcomes[step]) return;
    if (round.kind === 'estimate') playSound(correct ? 'correct' : 'wrong');
    setOutcomes(list => [...list, outcomeFor(round, correct, guess)]);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setResultOpen(true), round.kind === 'pick' ? RESULT_DELAY_MS : 0);
  };

  const next = () => {
    clearTimeout(timer.current);
    setResultOpen(false);
    setStep(value => value + 1);
    requestAnimationFrame(() => stageRef.current?.focus({ preventScroll: true }));
  };

  const restart = () => {
    clearTimeout(timer.current);
    setOutcomes([]);
    setStep(0);
    setResultOpen(false);
    setAttempt(value => value + 1);
  };

  const shareResult = async () => {
    const text = `Ich habe ${score} von ${total} Signature Words von ${name} erkannt.`;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'Bundestag Wrapped', text, url }); } catch { /* dismissed */ }
      return;
    }
    try { await navigator.clipboard.writeText(`${text} ${url}`); setShareNote('Ergebnis kopiert'); } catch { setShareNote('Kopieren nicht möglich'); }
  };

  const nextLabel = step + 1 >= total ? 'Ergebnis ansehen' : 'Weiter';

  return (
    <>
      <div className="mpq__bar">
        <div className="mpq__who">
          <div className="mpq__progress" role="progressbar" aria-label="Quiz-Fortschritt" aria-valuemin={1} aria-valuemax={total} aria-valuenow={Math.min(step + 1, total)} aria-valuetext={finished ? 'Quiz beendet' : `Runde ${step + 1} von ${total}`}>
            {Array.from({ length: total + 1 }, (_, index) => <span key={index} data-done={index <= step} />)}
          </div>
          <div className="mpq__name"><PartyPill party={party} />{name} · Signature Words</div>
        </div>
        <Link to={profileUrl} className="mpq__close" aria-label={`Quiz beenden, zurück zum Profil von ${name}`}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </Link>
      </div>

      <motion.div
        key={`${attempt}-${step}`}
        ref={stageRef}
        tabIndex={-1}
        className="mpq__stage outline-none"
        variants={STAGGER}
        initial={reduce ? false : 'hidden'}
        animate="visible"
      >
        {!finished ? (
          <>
            <motion.div variants={ENTER.rise} className="flex flex-col gap-4">
              <div className="mpq__kicker">
                <span className="mp-mono mp-muted text-sm">Runde {step + 1} von {total}</span>
                <span className="mpq__vs" data-scope={round.scope}>{VS_LABEL[round.scope]}</span>
              </div>
              <h1 className="mpq__question">{round.question}</h1>
            </motion.div>
            {round.kind === 'pick'
              ? <PickRound round={round} onAnswer={correct => answer(correct, null)} />
              : <EstimateRound round={round} done={!!outcome} onAnswer={guess => answer(estimateIsCorrect(guess, round.answer), guess)} />}
            {outcome && !resultOpen && (
              <motion.div variants={ENTER.rise} initial="hidden" animate="visible" className="flex flex-wrap items-center gap-4">
                <p className="m-0 text-lg font-bold" role="status">{outcome.verdict} {outcome.correct ? '' : `Richtig: ${outcome.stat}`}</p>
                <button type="button" className="mp-btn mp-btn--white mp-btn--lg" onClick={next}>{nextLabel}<ArrowIcon /></button>
              </motion.div>
            )}
          </>
        ) : (
          <>
            <motion.div variants={ENTER.rise} className="mpq-final__head">
              <div className="flex flex-col gap-3">
                <span className="mp-mono mp-muted text-sm">Deine {name}-Quote</span>
                <h1 className="mpq-final__score m-0">{score}<span>/{total}</span></h1>
              </div>
              <p className="mpq-final__line">{finalLine(score, total, name)}</p>
            </motion.div>
            <FinalTable quiz={quiz} />
            <motion.div variants={ENTER.rise} className="mpq-actions">
              <button type="button" className="mp-btn mp-btn--pink mp-btn--lg" onClick={restart}>Nochmal spielen</button>
              <button type="button" className="mp-btn mp-btn--ghost mp-btn--lg" onClick={() => void shareResult()}>Ergebnis teilen</button>
              <Link to={profileUrl} className="mp-btn mp-btn--lg text-white">Zum Profil<ArrowIcon /></Link>
              <span role="status" className="sr-only">{shareNote}</span>
            </motion.div>
          </>
        )}
      </motion.div>

      <AccessibleDialog open={resultOpen && !!outcome} onClose={() => setResultOpen(false)} labelledBy={verdictId}>
        <div className="ds-result-dialog">
          {outcome && (
            <motion.div
              className="mpq-card"
              data-correct={outcome.correct}
              style={partyStyle(party)}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <h2 id={verdictId} className="mpq-card__verdict">{outcome.verdict}</h2>
              <div className="mpq-card__stat">{outcome.stat}</div>
              {round.id !== 'bundestag-pick' && <RatioBars word={round.word} name={name} party={party} />}
              <div className="mpq-card__foot">
                <p>{outcome.explanation}</p>
                <button type="button" className="mp-btn mp-btn--ink mp-btn--lg" onClick={next}>{nextLabel}<ArrowIcon /></button>
              </div>
            </motion.div>
          )}
        </div>
      </AccessibleDialog>
    </>
  );
}

export function MdbQuizPage() {
  const surface = editionSurface(useOptionalEdition());
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: speaker, isLoading, error } = useSpeakerData(slug);
  const quiz = useMemo(() => (speaker ? buildMdbQuiz(speaker) : null), [speaker]);
  const profileUrl = editionPath(surface, `abgeordnete/${slug}`);

  if (isLoading) {
    return <div className="mp-page grid place-items-center"><p role="status" className="mp-muted">Lade Quiz …</p></div>;
  }

  if (error || !speaker || !quiz) {
    return (
      <div className="mp-page grid place-items-center px-6">
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="mp-h2">{speaker ? 'Für dieses Profil gibt es noch kein Quiz' : 'Profil nicht gefunden'}</p>
          <p className="mp-muted m-0">{speaker ? 'Dafür braucht es mindestens zwei Signaturwörter mit Vergleichswerten.' : error?.message}</p>
          <Link to={speaker ? profileUrl : editionPath(surface, 'abgeordnete')} className="mp-link">{speaker ? 'Zum Profil' : 'Zur Abgeordneten-Suche'}</Link>
        </div>
      </div>
    );
  }

  const name = displaySpeakerName(speaker);
  return (
    <>
      <SEO
        title={`Quiz: ${genitive(quiz.firstName)} Signature Words`}
        description={`Errätst du die Wörter, die ${name} im Bundestag öfter sagt als alle anderen?`}
        canonicalUrl={editionPath(surface, `abgeordnete/${speaker.slug}/quiz`)}
      />
      <div className="mp-page mpq" style={partyStyle(speaker.party)}>
        <Quiz quiz={quiz} name={quiz.firstName} party={speaker.party} profileUrl={profileUrl} />
      </div>
    </>
  );
}
