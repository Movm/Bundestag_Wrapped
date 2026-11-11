import { memo, useContext, useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { useReducedMotion } from 'motion/react';
import { ActionButton } from '@/design-system/components/ActionButton';
import { Slide } from '@/design-system/components/Slide';
import { StoryContext } from '@/components/main-wrapped/StoryContext';
import { END_SLIDE_CONTENT } from '@/shared/end-slide';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';

const SOCIAL = END_SLIDE_CONTENT.socialLinks.filter(link => link.label === 'LinkedIn' || link.label === 'Instagram');

const delay = (seconds: number) => ({ '--delay': `${seconds}s` }) as CSSProperties;
/** Marks a part as shown; CSS plays its entrance from there. */
const on = (visible: boolean) => (visible ? { 'data-on': '' } : {});

/** True while the slide is on screen, or always where motion is off (reading mode, reduced motion). */
function useShown(slideId: string) {
  const { activeId, readingMode } = useContext(StoryContext);
  const reduceMotion = useReducedMotion();
  const still = readingMode || !!reduceMotion;
  return { active: activeId === slideId, still, shown: still || activeId === slideId };
}

/** One word, letter by letter: each letter rises out of its own clip. */
function Letters({ word, base, step }: { word: string; base: number; step: number }) {
  return (
    <span aria-hidden="true" className="ds-end__word">
      {[...word].map((char, i) => (
        <span key={i} className="ds-end__clip">
          <span className="ds-end__letter" style={delay(base + i * step)}>{char === ' ' ? ' ' : char}</span>
        </span>
      ))}
    </span>
  );
}

/** "Das war Bundestag Wrapped": the first finale slide, after the design handoff "Endslide Alternativen". */
export const OutroSlide = memo(function OutroSlide() {
  const surface = editionSurface(useOptionalEdition());
  const { shown } = useShown('outro');
  return (
    <div className="ds-end">
      <Slide shapes="cover">
        <div className="ds-end__beat" {...on(shown)}>
          <p className="ds-end__eyebrow ds-end__in" style={delay(0.25)}>Das war</p>
          <h2 className="ds-display ds-display--hero ds-end__title">
            <span className="ds-end__in ds-end__pink" style={delay(0.37)}>Bundestag</span>{' '}
            <span className="ds-end__in ds-end__row" style={delay(0.49)}>
              Wrapped{' '}
              {surface.year && <span className="ds-end__year">{surface.year}</span>}
            </span>
          </h2>
        </div>
      </Slide>
    </div>
  );
});

interface EndSlideProps {
  onRestart?: () => void;
}

/** How long "Danke" and the quote stay before the credits take over. */
const THANKS_MS = 3500;

/**
 * "Danke" with the quote, then "Danke & bis bald" with the credits. The
 * credits follow on their own; a tap that misses every link and button brings
 * them sooner. Reading mode and reduced motion show them at once.
 */
export const EndSlide = memo(function EndSlide({ onRestart }: EndSlideProps) {
  const surface = editionSurface(useOptionalEdition());
  const { active, still, shown } = useShown('finale');
  const [creditsDue, setCreditsDue] = useState(false);
  const credits = still || creditsDue;

  // Leaving the slide rewinds it, so coming back plays the thanks again.
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (!active) setCreditsDue(false);
  }

  useEffect(() => {
    if (!active || credits) return;
    const timer = window.setTimeout(() => setCreditsDue(true), THANKS_MS);
    return () => window.clearTimeout(timer);
  }, [active, credits]);

  const skip = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target as Element).closest('a, button')) setCreditsDue(true);
  };

  return (
    // The tap only shortens a pause that ends on its own, so it needs no keyboard twin.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="ds-end ds-end--thanks" data-credits={credits || undefined} onClick={skip}>
      <Slide
        shapes="cover"
        footer={(
          <nav className="ds-end__links ds-end__in" style={delay(1.1)} aria-label="Mehr zu Bundestag Wrapped" inert={!credits} {...on(shown && credits)}>
            <Link to={editionPath(surface, 'abgeordnete')}>Abgeordnete</Link>
            <Link to={editionPath(surface, 'dokumentation')}>Dokumentation</Link>
            {SOCIAL.map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>)}
            <a href="https://www.moritz-waechter.de/impressum" target="_blank" rel="noopener noreferrer">Impressum</a>
            <Link to="/datenschutz">Datenschutz</Link>
          </nav>
        )}
      >
        <div className="ds-end__beat" {...on(shown)}>
          <h2 className="ds-display ds-end__title ds-end__thanks" aria-label={credits ? 'Danke & bis bald' : 'Danke'}>
            <span className="ds-end__pink ds-end__danke" data-small={credits || undefined}>
              <Letters word="Danke" base={0.3} step={0.06} />
            </span>
            <span className="ds-end__fold" data-open={credits || undefined}>
              <span className="ds-end__bald" {...on(shown && credits)}><Letters word="& bis bald" base={0.45} step={0.04} /></span>
            </span>
          </h2>
          {/* Reading mode and reduced motion open on the credits, where the quote has already given way. */}
          {!still && <div className="ds-end__fold" data-open={!credits || undefined}>
            <p className="ds-end__quote ds-end__in" style={delay(0.7)} inert={credits} {...on(shown && !credits)}>
              Die meisten demokratischen Politiker:innen leisten harte Arbeit für unser Land – unabhängig von ihrer Partei.
            </p>
          </div>}
          <div className="ds-end__fold" data-open={credits || undefined}>
            <div className="ds-end__credits ds-end__in" style={delay(0.85)} inert={!credits} {...on(shown && credits)}>
              <ActionButton size="lg" icon="restart" onClick={onRestart}>Nochmal</ActionButton>
              <p className="m-0 font-bold">Gemacht von Moritz Wächter.</p>
            </div>
          </div>
        </div>
      </Slide>
    </div>
  );
});
