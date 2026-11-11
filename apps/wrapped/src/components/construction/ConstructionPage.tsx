import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { SEO } from '@/components/seo/SEO';
import { PAGE_META } from '@/components/seo/constants';
import { Display, Mark } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';
import { dismissBootCover } from '@/cover/shell';
import './construction.css';

const TAPE = 'Baustelle · Bundestag Wrapped 2026 · ';

/**
 * Front door while no edition is public: the previous edition is superseded
 * and the next one is still a protected preview (see `isRetired` in edition/registry).
 */
export function ConstructionPage() {
  useEffect(dismissBootCover, []);

  return (
    <div className="bw-site" data-surface="violet">
      <SEO title={PAGE_META.construction.title} description={PAGE_META.construction.description} canonicalUrl="/" />
      <a className="bw-site__logo" href="/"><img src="/logo.png" alt="Bundestag Wrapped" width="160" height="32" /></a>

      <motion.main className="bw-site__main" initial="hidden" animate="visible" transition={{ staggerChildren: 0.07 }}>
        <Display size="hero" level={1} face="wide">Wir bauen <Mark>2026</Mark></Display>
        <motion.p variants={ENTER.rise} className="bw-site__lead">
          Die Ausgabe 2025 hat Platz gemacht. Gerade werten wir die Reden aus 2026 aus: Wer am meisten geredet hat,
          welche Wörter das Jahr geprägt haben und welches Jugendwort es ins Plenum geschafft hat. Bald geht es hier weiter.
        </motion.p>

        <motion.nav variants={ENTER.rise} className="bw-site__links" aria-label="Weiterhin erreichbar">
          <Link to="/mcp" className="ds-button ds-button--md ds-button--contrast ds-contrast">MCP-Server für deine KI</Link>
          <Link to="/datenschutz">Datenschutz</Link>
          <Link to="/terms">Nutzungsbedingungen</Link>
          <a href="https://www.moritz-waechter.de/impressum" target="_blank" rel="noopener noreferrer">Impressum</a>
        </motion.nav>
      </motion.main>
      <div className="bw-site__tape" aria-hidden="true">
        <span>{TAPE.repeat(6)}</span>
      </div>
    </div>
  );
}
